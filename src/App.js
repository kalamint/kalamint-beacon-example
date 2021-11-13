import React from 'react';

import MainView from './MainView';
import './App.scss';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h2> kalamint-beacon-example </h2>
            </header>
            <p> A simple dApp to demonstrate the use of Kalamint with Beacon </p>
            <MainView />
        </div>
    );
}

export default App;
