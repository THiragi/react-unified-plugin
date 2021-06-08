import React from 'react';
// import logo from './logo.svg';
import './App.css';
import { processor } from './plugin';

const App: React.FC = () => {
  const data = `
    dounimokounimo  

    [ぐーぐる](https://www.google.co.jp/)
    
    nannyakannya
  `;
  const html = processor.processSync(data).toString();

  return (
    <div className="App">
      <div>{html}</div>
    </div>
  );
};

export default App;
