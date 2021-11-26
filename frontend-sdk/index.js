function getTime() {
  const date = new Date();
  const hr = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  return `${hr}:${min}:${sec}`;
}

const time = getTime();
document.getElementById('time').innerText = time;
