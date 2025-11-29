import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { DataGridDemo } from './pages/demo';
import { Toaster } from 'sonner';

function Router() {
  const [route, setRoute] = React.useState(window.location.hash.slice(1) || '/');

  React.useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route === '/demo') {
    return <DataGridDemo />;
  }

  return <App />;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router />
    <Toaster />
  </React.StrictMode>
);