import React from 'react';
import {ThemeProvider} from './src/context/ThemeContext';
import {NotificationProvider} from './src/context/NotificationContext';
import {AppNavigator} from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppNavigator />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
