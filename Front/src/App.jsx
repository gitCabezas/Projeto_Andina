// Frontend/src/App.jsx (exemplo para React)
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/') // Ajuste a porta se necessário
      .then(response => response.text())
      .then(data => setMessage(data))
      .catch(error => console.error('Erro ao buscar mensagem:', error));
  }, []);

  return (
    <>
      <h1>Mensagem do Backend:</h1>
      <p>{message}</p>
    </>
  );
}

export default App;