import { useEffect } from 'react';
import { useState } from 'react'
import io from "socket.io-client";
const socket = io("http://localhost:4000");

function App() {
  const [text, setText] = useState("mensaje por defecto")
  const handleSubmit = (e)=>{
  e.preventDefault()
  const mensaje = e.target.mensaje.value
  socket.emit("message", mensaje)
  }
  useEffect(() => {
    socket.on("message", (sms) => {
      console.log(sms)
      setText(sms)
    })
  }, [])


  return (
    <>
      Mensaje de wsp: <pre>{text}</pre>
      <form onSubmit={handleSubmit}>
        <input type="text" name="mensaje" />
        <button type="submit">Enviar</button>
      </form>
    </>
  )
}

export default App
