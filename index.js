// Punto de entrada. registerRootComponent registra <App/> como el componente
// raiz de la app, equivalente a lo que hacia ReactDOM.render en la web.
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
