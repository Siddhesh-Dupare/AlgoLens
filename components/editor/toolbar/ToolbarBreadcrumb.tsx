'use client'

interface ToolbarBreadcrumbProps {
  rootName: string | null
  filePath: string | null
  fileName: string | null
  isDirty: boolean
}

function Separator() {
  return (
    <span
      style={{
        fontSize: 11,
        color: '#3c3c3c',
        margin: '0 1px',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      ›
    </span>
  )
}

export default function ToolbarBreadcrumb({
  rootName,
  filePath,
  fileName,
  isDirty,
}: ToolbarBreadcrumbProps) {
  if (rootName === null && fileName === null) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <span style={{ color: '#3c3c3c' }}>No file open</span>
      </div>
    )
  }

  const segments = filePath ? filePath.split('/').filter(Boolean) : []

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: '#8a8a8a',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: 0,
      }}
    >
      {rootName && (
        <span style={{ color: '#6a6a6a', flexShrink: 0 }}>{rootName}</span>
      )}

      {segments.map((segment, i) => (
        <span
          key={`${segment}-${i}`}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
        >
          <Separator />
          <span style={{ color: '#6a6a6a' }}>{segment}</span>
        </span>
      ))}

      {fileName && (
        <>
          {(rootName || segments.length > 0) && <Separator />}
          <span
            style={{
              color: '#cccccc',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            {fileName}
          </span>
          {isDirty && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#cccccc',
                flexShrink: 0,
                marginLeft: '2px',
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
