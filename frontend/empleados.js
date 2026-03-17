const { formatDiagnostic } = require("typescript");

const API = "http://127.0.0.1:8000";

const form = document.getElementById("formEmpleado");
const msg = document.getElementById("msg");
const tabla = document.getElementById("tablaEmpleados");
const btnReaload= document.getElementById("btnReload");

function setMsg(text,type){
    msg.textContent= text || "";
    msg.className="msg"+(type||"");
}

async function fetchJson(url, options) {
    const res=await fetch(url,options);
    const data=await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data?.detail || "Error");
    return data;
}

function money(v){
    return Number(v ||0 ).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
}
async function cargarEmpleados() {
    const emps =await fetchJson(`${API}/Empleados`);
    tabla.innerHTML="";

    if(!emps.length){
        tabla.innerHTML=`<tr><td colspan="5">No hay empelados registrados.</td></tr>`;
        return;
    }

    emps.forEach(e=>{
        const tr= document.createElement("tr");
        tr.innerHTML=`
        <td>${e.nombre}</td>
        <td>$${money(e.pago_diario)}</td>
        <td>${e.horas_dia}</td>
        <td><b>$${money(e.salario_hora)}</b></td>
        <td>${e.activo ? "✅":"-"}</td>`;
        tabla.appendChild(tr);
    });   
}

form.addEventListener("submit",async (ev)=>{
    ev.preventDefault();
    setMsg("","");

    const fd = new FormData(form);

    const body={
        nombre:String(fd.get("nombre")||"").trim(),
        pago_diario:Number(fd.get("pago_diario")),
        horas_dia:Number(fd.get("horas_dia")),
        activo:fd.get("activo")==="on",
    };

    try {
        await fetchJson(`${API}/empleados`,{
            method: "POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(body),
        });

        setMsg("Empelado Guardado ✅", "ok");
        form.reset();
        form.querySelector('input[name="activo"]').checked=true;
        form.querySelector('input[name="horas_dia"]').value=8;

        await cargarEmpleados();
    } catch (error) {
        setMsg(error.message,"err");
        
    }
});

btnReaload.addEventListener("click",async()=>{
    try {
        setMsg("Cargando.....","");
        await cargarEmpleados();
        setMsg(" Listo ✅ ", "ok");
    } catch (e) {
        setMsg(e.message,"err");
    }
});

(async function init() {
    await cargarEmpleados();
}) ();