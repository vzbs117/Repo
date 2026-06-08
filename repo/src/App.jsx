import { BrowserRouter,Route, Routes } from "react-router-dom";
import Topbar from "./components/Topbar"
// paginas 

import Home from "./pages/Home"
import Ingredientes from "./pages/Ingredientes"
import Recetas from "./pages/Recetas"
import Equipo from "./pages/Equipo"
import Negocio from "./pages/Negocio"

export default function App(){
  return(
    <BrowserRouter>
    {/* El top bar se muestra en todas las páginas */}
    <Topbar/>
    {/* Contenido cambia segun la ruta*/}
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/ingredientes" element={<Ingredientes/>}/>
      <Route path="/recetas" element={<Recetas/>}/>
      <Route path="/equipo" element={<Equipo/>}/>
      <Route path="/negocio" element={<Negocio/>}/>

      {/* Ruta 404 por si no existe la ruta*/}
      <Route path="*" element={
        <div style={{textAlign: 'center', padding:'80px 20px', color:'var(--muted)'}}>
          <div style={{fontSize: 40, marginBottom: 12}}>🔍</div>
          <div style={{fontFamily:'var(--font-display)', fontSize:24,marginBottom:8}}>
            Pagina no encontrada
          </div>
          <div style={{fontSize:14}}>
            <a href="/" style={{color:'var(--accent-text)'}}>
              Volver a la página principal
            </a>
          </div>
        </div>
        }/>
      </Routes>
    </BrowserRouter>
  )
}