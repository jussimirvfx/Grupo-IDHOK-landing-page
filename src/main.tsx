import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TrackingProvider } from './MetaTrackingProvider';

createRoot(document.getElementById('root')!).render(<TrackingProvider><App /></TrackingProvider>);
