import sys
import json
import os

# Variables from previous frame for change detection
_algolens_prev_vars = {}

_ALGOLENS_SKIP_TYPES = (
    'module', 'function', 'type', 'builtin_function_or_method', 'method',
)


def _algolens_record(name, value, out, scope='local'):
    """Record one variable into `out` (name -> frame-var dict). `scope` is
    'local' when the value lives in the current frame, 'outer' when it was
    surfaced from an enclosing scope / global (used to park it as a thumbnail)."""
    try:
        str_val = repr(value)
    except Exception:
        return
    if len(str_val) > 200:
        str_val = str_val[:200] + '...'
    out[name] = {
        'name': name,
        'value': str_val,
        'type': type(value).__name__,
        'scope': scope,
        'changed': (name not in _algolens_prev_vars
                    or _algolens_prev_vars.get(name) != str_val),
    }


def _algolens_is_instance(value):
    """A user-defined object (not a builtin / container)."""
    return (hasattr(value, '__dict__')
            and getattr(type(value), '__module__', '') != 'builtins')


def _algolens_is_node(value):
    """A linked-list node: a user object with a `next` reference."""
    return _algolens_is_instance(value) and hasattr(value, 'next')


_ALGOLENS_VALUE_FIELDS = ('val', 'value', 'data', 'key', 'item', 'info', 'element')


def _algolens_node_value(node):
    """The display value held by a node: a known field, else the first public
    non-link attribute, else '?'."""
    for f in _ALGOLENS_VALUE_FIELDS:
        if hasattr(node, f):
            v = getattr(node, f)
            return v if isinstance(v, str) else _algolens_short(v)
    try:
        for k, v in vars(node).items():
            if k in ('next', 'prev', 'left', 'right', 'children',
                     'neighbors', 'adj', 'edges', 'adjacent') or k.startswith('_'):
                continue
            return v if isinstance(v, str) else _algolens_short(v)
    except TypeError:
        pass
    return '?'


def _algolens_short(v):
    try:
        s = repr(v)
    except Exception:
        return '?'
    return s if len(s) <= 40 else s[:40] + '...'


def _algolens_chain(node):
    """Walk a node's `next` links into (values, ids), stopping on None, a cycle,
    or a non-node link."""
    vals, ids, seen = [], [], set()
    cur, cap = node, 0
    while cur is not None and id(cur) not in seen and cap < 200:
        if not _algolens_is_node(cur):
            break
        seen.add(id(cur))
        ids.append(id(cur))
        vals.append(_algolens_node_value(cur))
        cur = getattr(cur, 'next', None)
        cap += 1
    return vals, ids


def _algolens_user_frames(frame):
    """The live user frames, innermost first (skips builtin/<...> frames)."""
    out, f, depth = [], frame, 0
    while f is not None and depth < 40:
        if not f.f_code.co_filename.startswith('<'):
            out.append(f)
        f = f.f_back
        depth += 1
    return out


def _algolens_scope_items(frame):
    """name -> value across the whole live call stack plus the module-level
    globals each frame references. This is what keeps a data structure visible
    when execution descends into a function: an outer/global structure is still
    found, and every frame's reference to it becomes a cursor. Returns a list of
    (name, value) pairs (duplicates are fine — they drive pointer labels)."""
    items = []
    for f in _algolens_user_frames(frame):
        for name, value in list(f.f_locals.items()):
            if name.lower().startswith('_algolens') or name.startswith('__'):
                continue
            items.append((name, value))
        g = f.f_globals
        if g is not f.f_locals:  # not the module frame itself
            for name in f.f_code.co_names:  # globals/attrs the function uses
                if name.startswith('__') or name not in g:
                    continue
                items.append((name, g[name]))
    return items


def _algolens_local_ids(frame):
    """Object ids reachable from the *current* frame's own locals (one level into
    instances). A structure is 'active' (main stage) if it shares an id here;
    everything else in scope is 'outer' (parked as a thumbnail)."""
    ids = set()
    for name, value in list(frame.f_locals.items()):
        if name.lower().startswith('_algolens') or name.startswith('__'):
            continue
        ids.add(id(value))
        if _algolens_is_instance(value):
            try:
                for a, av in vars(value).items():
                    if not a.startswith('__'):
                        ids.add(id(av))
            except TypeError:
                pass
    return ids


def _algolens_node_refs(frame):
    """Collect name -> node for every node reference across the live scope,
    including one level of instance attributes (e.g. self.head)."""
    refs = {}
    for name, value in _algolens_scope_items(frame):
        if _algolens_is_node(value):
            refs.setdefault(name, value)
        elif _algolens_is_instance(value):
            try:
                attrs = vars(value)
            except TypeError:
                attrs = {}
            for attr, aval in list(attrs.items()):
                if not attr.startswith('__') and _algolens_is_node(aval):
                    refs.setdefault(attr, aval)
    return refs


def _algolens_linkedlists(frame):
    """Build every distinct linked-list chain in scope. A chain starts at a node
    with no incoming `next` (a head); this surfaces both lists during a reverse
    (the reversed prefix + the remaining suffix) or a merge. Returns a list of
    {name, nodes, pointers, doubly}."""
    refs = _algolens_node_refs(frame)
    if not refs:
        return []

    local_ids = _algolens_local_ids(frame)

    # Gather all reachable nodes and the next-link graph.
    all_nodes, nexts = {}, {}
    for node in refs.values():
        cur, seen, cap = node, set(), 0
        while cur is not None and id(cur) not in seen and cap < 200:
            if not _algolens_is_node(cur):
                break
            seen.add(id(cur))
            all_nodes[id(cur)] = cur
            nxt = getattr(cur, 'next', None)
            nexts[id(cur)] = id(nxt) if _algolens_is_node(nxt) else None
            cur = nxt if _algolens_is_node(nxt) else None
            cap += 1
    if not all_nodes:
        return []

    incoming = {nid: 0 for nid in all_nodes}
    for nx in nexts.values():
        if nx in incoming:
            incoming[nx] += 1
    heads = [nid for nid in all_nodes if incoming[nid] == 0]
    if not heads:  # pure cycle: fall back to the referenced nodes
        heads = [id(n) for n in refs.values()]

    name_by_id = {}
    for name, node in refs.items():
        name_by_id.setdefault(id(node), name)

    lists, covered, used_names = [], set(), set()
    for hid in heads:
        if hid in covered:
            continue
        vals, ids, cur, seen = [], [], hid, set()
        while cur is not None and cur not in seen:
            seen.add(cur)
            ids.append(cur)
            vals.append(_algolens_node_value(all_nodes[cur]))
            covered.add(cur)
            cur = nexts.get(cur)
        index_of = {nid: i for i, nid in enumerate(ids)}
        pointers = {name: index_of[id(node)] for name, node in refs.items()
                    if id(node) in index_of}
        # Stable, unique name for cross-frame diffing.
        base = name_by_id.get(hid, 'list')
        name = base
        k = 2
        while name in used_names:
            name = base + str(k)
            k += 1
        used_names.add(name)
        active = any(nid in local_ids for nid in ids)
        lists.append({'name': name, 'nodes': vals, 'pointers': pointers,
                      'doubly': hasattr(all_nodes[ids[0]], 'prev'), 'active': active})
    return lists


def _algolens_is_tree(value):
    """A tree node: a user object with left/right (binary) or children (n-ary)."""
    return _algolens_is_instance(value) and (
        hasattr(value, 'left') or hasattr(value, 'right') or hasattr(value, 'children'))


def _algolens_tree_children(node):
    """Ordered child references of a node (None entries kept for binary slots)."""
    if hasattr(node, 'children'):
        ch = getattr(node, 'children')
        return list(ch) if isinstance(ch, (list, tuple)) else []
    return [getattr(node, 'left', None), getattr(node, 'right', None)]


def _algolens_tree_build(root):
    """Flatten a tree (BFS order) into nodes [{v, children:[idx]}] + an id->index
    map. Binary nodes keep two slots (-1 for a missing child)."""
    binary = not hasattr(root, 'children')
    order, index = [root], {id(root): 0}
    queue = [root]
    while queue:
        node = queue.pop(0)
        for ch in _algolens_tree_children(node):
            if ch is None or not _algolens_is_instance(ch) or id(ch) in index:
                continue
            index[id(ch)] = len(order)
            order.append(ch)
            queue.append(ch)

    nodes = []
    for node in order:
        kids = _algolens_tree_children(node)
        if binary:
            left = kids[0] if len(kids) > 0 else None
            right = kids[1] if len(kids) > 1 else None
            ci = [index.get(id(left), -1) if left is not None else -1,
                  index.get(id(right), -1) if right is not None else -1]
        else:
            ci = [index[id(c)] for c in kids
                  if c is not None and id(c) in index]
        nodes.append({'v': _algolens_node_value(node), 'children': ci})
    return {'nodes': nodes, 'binary': binary, 'index': index}


def _algolens_tree_view(frame):
    """Pick the largest tree across the live scope and map named references onto
    its nodes (so recursion shows the whole tree with the path as cursors)."""
    refs = {}
    for name, value in _algolens_scope_items(frame):
        if _algolens_is_tree(value):
            refs.setdefault(name, value)
        elif _algolens_is_instance(value):
            try:
                attrs = vars(value)
            except TypeError:
                attrs = {}
            for attr, aval in list(attrs.items()):
                if not attr.startswith('__') and _algolens_is_tree(aval):
                    refs.setdefault(attr, aval)
    if not refs:
        return None

    best_name, best = None, None
    for name, node in refs.items():
        built = _algolens_tree_build(node)
        prefer = name in ('root', 'tree', 'bst')
        if (best is None or len(built['nodes']) > len(best['nodes'])
                or (len(built['nodes']) == len(best['nodes']) and prefer)):
            best_name, best = name, built

    pointers = {name: best['index'][id(node)] for name, node in refs.items()
                if id(node) in best['index']}
    local_ids = _algolens_local_ids(frame)
    active = any(nid in local_ids for nid in best['index'])
    return {'name': best_name, 'nodes': best['nodes'],
            'binary': best['binary'], 'pointers': pointers, 'active': active}


_ALGOLENS_GRAPH_FIELDS = ('neighbors', 'adj', 'edges', 'adjacent')


def _algolens_is_graphnode(value):
    """A graph node: a user object exposing a neighbour/adjacency list."""
    return _algolens_is_instance(value) and any(
        hasattr(value, a) for a in _ALGOLENS_GRAPH_FIELDS)


def _algolens_graphnode_neighbors(node):
    for a in _ALGOLENS_GRAPH_FIELDS:
        if hasattr(node, a):
            v = getattr(node, a)
            if isinstance(v, (list, tuple, set)):
                return list(v)
    return []


def _algolens_label(k):
    return k if isinstance(k, str) else _algolens_short(k)


def _algolens_dict_graph(value):
    """Read a dict as an adjacency list if every value is an iterable and at
    least one neighbour is itself a key (i.e. edges connect nodes). Neighbours
    may be plain ids or (id, weight) pairs."""
    if not isinstance(value, dict) or not value:
        return None
    for v in value.values():
        if not isinstance(v, (list, tuple, set)):
            return None

    keyset = set(value.keys())
    labels, label_index = [], {}

    def node_index(k):
        lab = _algolens_label(k)
        if lab not in label_index:
            label_index[lab] = len(labels)
            labels.append(lab)
        return label_index[lab]

    for k in value:
        node_index(k)

    edges, has_edge_to_key = [], False
    for k, nbrs in value.items():
        src = node_index(k)
        for nb in nbrs:
            weight = None
            target = nb
            if isinstance(nb, (list, tuple)) and len(nb) == 2:
                target, weight = nb[0], nb[1]
            try:
                if target in keyset:
                    has_edge_to_key = True
            except TypeError:
                pass
            edge = [src, node_index(target)]
            if weight is not None:
                edge.append(_algolens_label(weight))
            edges.append(edge)

    if not has_edge_to_key:
        return None

    eset = set((e[0], e[1]) for e in edges)
    undirected = all((b, a) in eset for a, b, *_ in edges)
    return {'nodes': labels, 'edges': edges, 'directed': not undirected,
            'pointers': {}}


def _algolens_graph_view(frame):
    """Build a graph from a dict adjacency list (preferred) or node objects,
    searched across the whole live scope so a global graph stays visible."""
    items = _algolens_scope_items(frame)
    local_ids = _algolens_local_ids(frame)

    best, best_id = None, None
    for name, value in items:
        if isinstance(value, dict):
            try:
                g = _algolens_dict_graph(value)
            except Exception:
                g = None
            if g and (best is None or len(g['nodes']) > len(best['nodes'])):
                g['name'] = name
                best, best_id = g, id(value)
    if best is not None:
        best['active'] = best_id in local_ids
        return best

    refs = {}
    for name, value in items:
        if _algolens_is_graphnode(value):
            refs.setdefault(name, value)
        elif _algolens_is_instance(value):
            try:
                attrs = vars(value)
            except TypeError:
                attrs = {}
            for attr, aval in list(attrs.items()):
                if not attr.startswith('__') and _algolens_is_graphnode(aval):
                    refs.setdefault(attr, aval)
    if not refs:
        return None

    index, order = {}, []
    for nd in refs.values():
        if id(nd) not in index:
            index[id(nd)] = len(order)
            order.append(nd)
    i = 0
    while i < len(order):
        nd = order[i]
        i += 1
        for nb in _algolens_graphnode_neighbors(nd):
            if _algolens_is_instance(nb) and id(nb) not in index:
                index[id(nb)] = len(order)
                order.append(nb)

    labels = [_algolens_node_value(nd) for nd in order]
    edges = []
    for nd in order:
        s = index[id(nd)]
        for nb in _algolens_graphnode_neighbors(nd):
            if _algolens_is_instance(nb) and id(nb) in index:
                edges.append([s, index[id(nb)]])
    eset = set((e[0], e[1]) for e in edges)
    undirected = all((b, a) in eset for a, b, *_ in edges)
    pointers = {name: index[id(nd)] for name, nd in refs.items() if id(nd) in index}
    active = any(nid in local_ids for nid in index)
    return {'name': next(iter(refs)), 'nodes': labels, 'edges': edges,
            'directed': not undirected, 'pointers': pointers, 'active': active}


def _algolens_hashmaps(frame, skip_names):
    """Plain dicts in scope (not the adjacency graph) -> key/value views."""
    out, seen = [], set()
    for name, value in _algolens_scope_items(frame):
        if not isinstance(value, dict) or name in skip_names or name in seen:
            continue
        seen.add(name)
        entries = []
        for k, v in list(value.items())[:50]:
            entries.append([_algolens_label(k),
                            v if isinstance(v, str) else _algolens_short(v)])
        out.append({'name': name, 'entries': entries})
    return out


def _algolens_collect(name, value, out, expand=True, scope='local'):
    """Add `value` to `out`. A user-defined object (e.g. a class holding queues
    in self.q1 / self.q2) is expanded into its public attributes so the data
    structures inside it become visible instead of an opaque <object> repr.
    Linked-list nodes are skipped here; they are emitted as a `linkedlist`."""
    if type(value).__name__ in _ALGOLENS_SKIP_TYPES:
        return
    if _algolens_is_node(value) or _algolens_is_tree(value) or _algolens_is_graphnode(value):
        return
    if (expand and _algolens_is_instance(value)):
        try:
            attrs = vars(value)
        except TypeError:
            attrs = {}
        for attr, aval in list(attrs.items()):
            if attr.startswith('__'):  # skip dunders; keep _items / _head etc.
                continue
            # Expand only one level deep; nested objects show as their repr.
            _algolens_collect(name + '.' + attr, aval, out, expand=False, scope=scope)
        return
    _algolens_record(name, value, out, scope)


def _algolens_tracer(frame, event, arg):
    global _algolens_prev_vars

    # Only trace events in the user's file; skip internals and this tracer.
    filename = frame.f_code.co_filename
    if filename.startswith('<') or 'pythonTracer' in filename:
        return _algolens_tracer

    if event not in ('call', 'line', 'return'):
        return _algolens_tracer

    # Capture local variables. Skip the tracer's own state and Python internals
    # exposed at module scope (dunders); user objects are expanded into their
    # attributes by _algolens_collect.
    local_vars = {}
    for name, value in list(frame.f_locals.items()):
        if name.lower().startswith('_algolens') or name.startswith('__'):
            continue
        _algolens_collect(name, value, local_vars)

    # Surface module-level container structures the function references (e.g. a
    # global array / dict / deque used inside it) so they stay visible in scope.
    g = frame.f_globals
    if g is not frame.f_locals:  # not the module frame itself
        for name in frame.f_code.co_names:
            if name.startswith('__') or name in local_vars or name not in g:
                continue
            val = g[name]
            if (isinstance(val, (list, dict, set, str))
                    or type(val).__name__ == 'deque'
                    or _algolens_is_instance(val)):
                _algolens_collect(name, val, local_vars, scope='outer')

    # Linked lists: serialize each reachable chain + named pointers (nodes were
    # skipped above). Multiple chains appear during a reverse / merge.
    try:
        lls = _algolens_linkedlists(frame)
    except Exception:
        lls = []
    for ll in lls:
        ll_val = json.dumps({'nodes': ll['nodes'], 'pointers': ll['pointers'],
                             'doubly': ll['doubly']})
        key = '__ll__' + ll['name']
        local_vars[key] = {
            'name': ll['name'],
            'value': ll_val,
            'type': 'linkedlist',
            'scope': 'local' if ll.get('active') else 'outer',
            'changed': (key not in _algolens_prev_vars
                        or _algolens_prev_vars.get(key) != ll_val),
        }

    # Tree (binary / BST / n-ary / AST): flatten the largest in-scope tree.
    try:
        tree = _algolens_tree_view(frame)
    except Exception:
        tree = None
    if tree is not None:
        tree_val = json.dumps({'nodes': tree['nodes'], 'binary': tree['binary'],
                               'pointers': tree['pointers']})
        key = '__tree__' + tree['name']
        local_vars[key] = {
            'name': tree['name'],
            'value': tree_val,
            'type': 'tree',
            'scope': 'local' if tree.get('active') else 'outer',
            'changed': (key not in _algolens_prev_vars
                        or _algolens_prev_vars.get(key) != tree_val),
        }

    # Graph (adjacency dict or node objects): nodes + edges, possibly directed.
    try:
        graph = _algolens_graph_view(frame)
    except Exception:
        graph = None
    if graph is not None:
        local_vars.pop(graph['name'], None)  # don't also show the raw dict
        graph_val = json.dumps({'nodes': graph['nodes'], 'edges': graph['edges'],
                                'directed': graph['directed'],
                                'pointers': graph['pointers']})
        key = '__graph__' + graph['name']
        local_vars[key] = {
            'name': graph['name'],
            'value': graph_val,
            'type': 'graph',
            'scope': 'local' if graph.get('active') else 'outer',
            'changed': (key not in _algolens_prev_vars
                        or _algolens_prev_vars.get(key) != graph_val),
        }

    # Hash maps: any other dict in scope (e.g. a `seen` lookup) as a key/value view.
    try:
        skip = {graph['name']} if graph is not None else set()
        hms = _algolens_hashmaps(frame, skip)
    except Exception:
        hms = []
    for hm in hms:
        local_vars.pop(hm['name'], None)  # don't also show the raw dict
        hm_val = json.dumps({'entries': hm['entries']})
        key = '__hm__' + hm['name']
        local_vars[key] = {
            'name': hm['name'],
            'value': hm_val,
            'type': 'hashmap',
            'scope': 'local',
            'changed': (key not in _algolens_prev_vars
                        or _algolens_prev_vars.get(key) != hm_val),
        }

    # Build call stack (innermost first, then reversed to outermost first)
    call_stack = []
    f = frame
    depth = 0
    while f is not None and depth < 10:
        call_stack.append({
            'functionName': f.f_code.co_name,
            'lineNumber': f.f_lineno,
            'filename': os.path.basename(f.f_code.co_filename),
        })
        f = f.f_back
        depth += 1

    frame_data = {
        'type': 'frame',
        'frameIndex': -1,
        'lineNumber': frame.f_lineno,
        'variables': local_vars,
        'stepType': event,
        'callStack': call_stack[::-1],
        'sourceCode': '',
    }

    print('__ALGOLENS_FRAME__:' + json.dumps(frame_data), flush=True)

    _algolens_prev_vars = {k: v['value'] for k, v in local_vars.items()}
    return _algolens_tracer


sys.settrace(_algolens_tracer)

# sys.settrace only starts tracing frames entered AFTER this call (it fires on a
# function 'call' event). The module frame is already running, so plain
# top-level user code (no function) would never be traced. Enable tracing on the
# current (module) frame so top-level code is captured too.
sys._getframe().f_trace = _algolens_tracer

# ── USER CODE STARTS BELOW ──────────────────────────────────────────────────
