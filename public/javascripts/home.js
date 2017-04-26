function checkRoomName() {
  const roomName = document.getElementById("room_name");
  if(roomName.value.length <= 0) {
    alert("Room name cannot be empty!");
    return false;
  }
}