const DIGITS=["〇","一","二","三","四","五","六","七","八","九"];
const SMALL=["","十","百","千"];
const UNITS=["","万","亿","兆"];
const HISTORY_KEY="cn_calc_history_v1";
const MONTH=30*24*60*60*1000;
let raw="";
let lastResult=null;
let justEvaluated=false;

const $=s=>document.querySelector(s);
const expressionEl=$("#expression"), resultEl=$("#result"), panel=$("#historyPanel"), calc=$("#calculator");
const toastEl=$("#toast");

function trimZeros(s){return s.replace(/^0+(?=\d)/,"")||"0"}

function sectionToChinese(n){
  n=Number(n); if(n===0)return "";
  const ds=String(n).padStart(4,"0").split("").map(Number);
  let out="", zero=false;
  for(let i=0;i<4;i++){
    const d=ds[i], pos=3-i;
    if(d){ if(zero&&out)out+="零"; out+=DIGITS[d]+SMALL[pos]; zero=false; }
    else if(out) zero=true;
  }
  return out;
}
function integerToChinese(n){
  n=BigInt(n);
  if(n===0n)return "〇";
  if(n<0n)return "负"+integerToChinese(-n);
  let s=n.toString(), parts=[], idx=0;
  while(s.length){parts.unshift(s.slice(-4));s=s.slice(0,-4);idx++}
  let out="";
  for(let i=0;i<parts.length;i++){
    const v=Number(parts[i]), pos=parts.length-1-i;
    if(v===0)continue;
    if(out && v<1000)out+="零";
    out+=sectionToChinese(v)+(UNITS[pos]||"");
  }
  return out||"〇";
}
function numberToChinese(value){
  if(!Number.isFinite(value)) return "错误";
  if(Object.is(value,-0)) value=0;
  const sign=value<0?"负":"", abs=Math.abs(value);
  const str=String(abs);
  if(str.includes("e")) return sign+String(abs);
  const [i,d]=str.split(".");
  let out=sign+integerToChinese(i);
  if(d){out+="点"+[...d].map(x=>DIGITS[Number(x)]).join("")}
  return out;
}
function displayExpr(expr){
  return expr.replace(/\d+(?:\.\d+)?/g,m=>numberToChinese(Number(m)))
    .replace(/\*/g," × ").replace(/\//g," ÷ ").replace(/-/g," − ").replace(/\+/g," + ");
}
function prettyNumber(n){
  return numberToChinese(n);
}

function tokenize(s){
  const out=[]; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/\d|\./.test(c)){
      let j=i+1; while(j<s.length&&/[\d.]/.test(s[j]))j++;
      out.push(s.slice(i,j)); i=j; continue;
    }
    if("+-*/%()".includes(c)){out.push(c);i++;continue}
    throw Error("invalid");
  }
  return out;
}
function prec(op){return op==="+"||op==="-"?1:op==="*"||op==="/"||op==="%"?2:0}
function applyOp(vals,op){
  if(op==="%"){if(!vals.length)throw Error("bad"); vals.push(vals.pop()/100); return}
  if(vals.length<2)throw Error("bad");
  const b=vals.pop(),a=vals.pop();
  if(op==="+")vals.push(a+b);
  else if(op==="-")vals.push(a-b);
  else if(op==="*")vals.push(a*b);
  else if(op==="/"){if(b===0)throw Error("zero");vals.push(a/b)}
}
function evaluate(s){
  const t=tokenize(s), vals=[], ops=[];
  let expectValue=true;
  for(let i=0;i<t.length;i++){
    const x=t[i];
    if(/^\d/.test(x)){vals.push(Number(x));expectValue=false;continue}
    if(x==="("){ops.push(x);expectValue=true;continue}
    if(x===")"){
      while(ops.length&&ops.at(-1)!=="(")applyOp(vals,ops.pop());
      if(ops.pop()!=="(")throw Error("paren");
      expectValue=false;continue;
    }
    if(x==="%"){applyOp(vals,"%");expectValue=false;continue}
    if("+-*/".includes(x)){
      if(expectValue && x==="-"){vals.push(0)}
      while(ops.length&&ops.at(-1)!=="("&&prec(ops.at(-1))>=prec(x))applyOp(vals,ops.pop());
      ops.push(x);expectValue=true;
    }
  }
  while(ops.length){const o=ops.pop();if(o==="(")throw Error("paren");applyOp(vals,o)}
  if(vals.length!==1||!Number.isFinite(vals[0]))throw Error("bad");
  return Number.isInteger(vals[0])?vals[0]:Number(vals[0].toFixed(12));
}
function render(){
  expressionEl.textContent=raw?displayExpr(raw):"";
  if(lastResult!==null) resultEl.textContent=prettyNumber(lastResult);
  else if(raw){
    try{
      const trailing=raw.endsWith(("+","-","*","/"));
      resultEl.textContent=trailing?"":prettyNumber(evaluate(raw));
    }catch{resultEl.textContent=displayExpr(raw)}
  }else resultEl.textContent="〇";
}
function appendDigit(d){
  if(justEvaluated){raw="";lastResult=null;justEvaluated=false}
  const m=raw.match(/(\d+(?:\.\d*)?|\.\d*)$/);
  if(m){
    const current=m[0];
    if(current==="0"&&d!=="0"&&!current.includes("."))raw=raw.slice(0,-1)+d;
    else raw+=d;
  }else raw+=d;
  render();
}
function appendDecimal(){
  if(justEvaluated){raw="";lastResult=null;justEvaluated=false}
  const m=raw.match(/(\d+(?:\.\d*)?|\.\d*)$/);
  if(m&&m[0].includes("."))return;
  raw+=m?".":"0.";
  render();
}
function appendOperator(op){
  if(!raw){if(op==="-" )raw="-";else return}
  if(/[+\-*/]$/.test(raw))raw=raw.slice(0,-1)+op;else raw+=op;
  justEvaluated=false;render();
}
function clear(){raw="";lastResult=null;justEvaluated=false;render()}
function backspace(){if(justEvaluated){clear();return} raw=raw.slice(0,-1);render()}
function paren(){
  if(justEvaluated){raw="";lastResult=null;justEvaluated=false}
  const opens=(raw.match(/\(/g)||[]).length, closes=(raw.match(/\)/g)||[]).length;
  if(!raw||/[+\-*/(]$/.test(raw))raw+="(";
  else if(opens>closes)raw+=")";
  render();
}
function saveHistory(expr,res){
  const now=Date.now();
  let h=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  h=h.filter(x=>now-x.time<MONTH);
  h.unshift({expr,result:res,time:now});
  localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(0,200)));
}
function loadHistory(){
  const now=Date.now();
  let h=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  const fresh=h.filter(x=>now-x.time<MONTH);
  if(fresh.length!==h.length)localStorage.setItem(HISTORY_KEY,JSON.stringify(fresh));
  return fresh;
}
function renderHistory(){
  const list=$("#historyList"), empty=$("#emptyHistory"), h=loadHistory();
  list.innerHTML="";
  empty.style.display=h.length?"none":"block";
  h.forEach(item=>{
    const el=document.createElement("button"); el.type="button"; el.className="history-item";
    const date=new Date(item.time);
    el.innerHTML=`<div><div class="history-expression">${escapeHtml(displayExpr(item.expr))}</div><div class="history-result">${escapeHtml(prettyNumber(item.result))}</div></div><div class="history-time">${date.toLocaleDateString()}<br>${date.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>`;
    el.addEventListener("click",()=>{raw=String(item.result);lastResult=item.result;justEvaluated=true;panel.classList.add("hidden");calc.classList.remove("hidden");render()});
    list.appendChild(el);
  });
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function equals(){
  if(!raw)return;
  try{
    const expr=raw, res=evaluate(raw);
    saveHistory(expr,res); lastResult=res; raw=String(res); justEvaluated=true; render();
    toast("已保存到历史");
  }catch(e){toast(e.message==="zero"?"不能除以零":"表达式无效")}
}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>toastEl.classList.remove("show"),1500)}

document.querySelectorAll("[data-digit]").forEach(b=>b.addEventListener("click",()=>appendDigit(b.dataset.digit)));
document.querySelectorAll('[data-action="operator"]').forEach(b=>b.addEventListener("click",()=>appendOperator(b.dataset.value)));
document.querySelector('[data-action="clear"]').addEventListener("click",clear);
document.querySelector('[data-action="backspace"]').addEventListener("click",backspace);
document.querySelector('[data-action="decimal"]').addEventListener("click",appendDecimal);
document.querySelector('[data-action="paren"]').addEventListener("click",paren);
document.querySelector('[data-action="percent"]').addEventListener("click",()=>{if(raw)raw+="%";render()});
document.querySelector('[data-action="equals"]').addEventListener("click",equals);
$("#historyBtn").addEventListener("click",()=>{panel.classList.toggle("hidden");calc.classList.toggle("hidden");if(!panel.classList.contains("hidden"))renderHistory()});
$("#clearHistory").addEventListener("click",()=>{localStorage.removeItem(HISTORY_KEY);renderHistory();toast("历史记录已清空")});
$("#menuBtn").addEventListener("click",()=>toast("中文计算器 · 离线 PWA"));

window.addEventListener("keydown",e=>{
  if(e.key>="0"&&e.key<="9")appendDigit(e.key);
  else if("+-*/".includes(e.key))appendOperator(e.key);
  else if(e.key===".")appendDecimal();
  else if(e.key==="Enter"||e.key==="=")equals();
  else if(e.key==="Backspace")backspace();
  else if(e.key==="Escape")clear();
  else if(e.key==="%"){if(raw)raw+="%";render()}
});
function updateOnline(){const on=navigator.onLine;$("#offlineStatus").textContent=on?"●":"○";$("#offlineStatus").classList.toggle("offline",!on);$("#offlineStatus").title=on?"在线":"离线"}
window.addEventListener("online",updateOnline);window.addEventListener("offline",updateOnline);updateOnline();
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").then(()=>{}).catch(()=>{})}
render();renderHistory();