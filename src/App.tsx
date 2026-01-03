import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="mx-auto max-w-7xl p-8 text-center">
      <h1>Vite + React</h1>
      <div>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
