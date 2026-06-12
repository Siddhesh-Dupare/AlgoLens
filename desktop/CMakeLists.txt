cmake_minimum_required(VERSION 3.20)
project (AlgoLens CXX C)

# Set the global C++ Standard
set(CMAKE_CXX_STANDARD 20)

include (FetchContent)

# Fetching SDL3 latest version from the repository
FetchContent_Declare(SDL3
  GIT_REPOSITORY https://github.com/libsdl-org/SDL.git
  GIT_TAG release-3.4.10)

set(SDL_SHARED ON CACHE BOOL "" FORCE)
set(SDL_STATIC OFF CACHE BOOL "" FORCE)
set(SDL_TEST OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(SDL3)

add_executable(AlgoLensRenderer
  renderer/app.cpp
  main.cpp
)

target_link_libraries(AlgoLensRenderer PRIVATE
  SDL3::SDL3 opengl32
)

add_custom_command(TARGET AlgoLensRenderer POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_if_different
  "$<TARGET_FILE:SDL3::SDL3>" "$<TARGET_FILE_DIR:AlgoLensRenderer>"
  COMMENT "Copying SDL3.dll....")
