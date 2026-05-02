let folders=[],cards=[],editId=null,ctxId=null,selType='habit';
let clItems=[],nfFields=[];
let reorder=false,dark=false,bn='My Workspace';
let curView='home',activeFolderId=null,activeBoardId=null;
let activePicker=null,calY,calM,showSrch=false,sq='';
let editFolderId=null;

const TYPES={habit:{label:'Habit'},focus:{label:'Focus'},output:{label:'Output'},project:{label:'Project'},waiting:{label:'Waiting'},note:{label:'Note'},custom:{label:'Custom'}};
const FT={text:{label:'Text',sym:'T'},number:{label:'Number',sym:'#'},date:{label:'Date',sym:'D'},select:{label:'Select',sym:'S'},multi:{label:'Multi',sym:'M'},check:{label:'Check',sym:'☑'},url:{label:'URL',sym:'↗'},email:{label:'Email',sym:'@'},phone:{label:'Phone',sym:'☏'},person:{label:'Person',sym:'☺'},rating:{label:'Rating',sym:'★'},progress:{label:'Progress',sym:'%'},formula:{label:'Formula',sym:'f'},file:{label:'File',sym:'↑'},longtext:{label:'Long text',sym:'¶'}};
const FT_GROUPS=[{sec:'Basic',keys:['text','number','date','check']},{sec:'Select',keys:['select','multi']},{sec:'Contact',keys:['url','email','phone','person']},{sec:'Visual',keys:['rating','progress']},{sec:'Other',keys:['formula','file','longtext']}];

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function defVal(t){const m={check:false,multi:[],rating:0,progress:0,number:0};return m[t]!==undefined?m[t]:'';}

// Folder SVG icon (generic folder shape)
function folderSVG(){return `<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`;}
