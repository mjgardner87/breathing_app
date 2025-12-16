import React from 'react';
import {ThemeProvider} from './src/context/ThemeContext';
import {AppNavigator} from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}

export default App;
