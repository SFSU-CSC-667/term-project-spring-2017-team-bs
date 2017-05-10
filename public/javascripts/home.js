function checkRoomName() {
  const roomName = document.getElementById('room_name');
  if(roomName.value.length <= 0) {
    $('#createGameRoomNameModal').modal();
    return false;
  }
}