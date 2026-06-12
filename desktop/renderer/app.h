#pragma once

#include <SDL3/SDL.h>

class app {
    public:
        app();
        ~app();
        bool init();
        void run();
        void shutdown();

    private:
        SDL_Window* window;
        SDL_GLContext glContext;

        bool running;
        int WIDTH;
        int HEIGHT;
};
