// ==========================================================================
// Socket.io registry.
// Kept in its own module so controllers can emit without importing server.js
// (which would create a circular import).
// ==========================================================================
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => ioInstance;

export const emitToRoom = (room, event, payload) => {
  if (ioInstance) ioInstance.to(room).emit(event, payload);
};
