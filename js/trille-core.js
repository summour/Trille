function init(){
  const tc=localStorage.getItem('t-cards2'),tf=localStorage.getItem('t-folders2'),tb=localStorage.getItem('t-board'),th=localStorage.getItem('t-theme');
  if(tc)cards=JSON.parse(tc);
  if(tf)folders=JSON.parse(tf);
  if(tb)bn=tb;
  if(!folders.length&&!cards.length)loadDefaults();
  if(th==='dark')setDark(true);
  document.getElementById('bn-in').value=bn;
  renderTypeGrid();
  switchView('home');
}
function save(){localStorage.setItem('t-cards2',JSON.stringify(cards));localStorage.setItem('t-folders2',JSON.stringify(folders));localStorage.setItem('t-board',bn);}

function loadDefaults(){
  const f1={id:uid(),name:'OCSC Study'};
  const f2={id:uid(),name:'Personal'};
  const f3={id:uid(),name:'Projects'};
  folders=[f1,f2,f3];
  cards=[
    {id:uid(),folderId:f1.id,type:'habit',title:'Daily Routine',desc:'Low-load daily habits',items:[{id:uid(),text:'Yoga 10 min',done:true},{id:uid(),text:'Light diet',done:true},{id:uid(),text:'English input',done:false},{id:uid(),text:'1 online lecture',done:false},{id:uid(),text:'Savings transfer',done:false}],note:'Feeling more refreshed today.',nf:[]},
    {id:uid(),folderId:f1.id,type:'focus',title:'ก.พ. Phase ก',desc:'',nf:[{id:uid(),key:'D-Day',type:'date',value:'2026-07-05'},{id:uid(),key:'Best slot',type:'text',value:'08:00 – 10:00'},{id:uid(),key:'Status',type:'select',value:'In Progress'},{id:uid(),key:'Progress',type:'progress',value:60}]},
    {id:uid(),folderId:f1.id,type:'waiting',title:'Google Data Analytics',desc:'',nf:[{id:uid(),key:'Status',type:'text',value:'Awaiting Financial Aid'},{id:uid(),key:'Check date',type:'date',value:'2026-05-16'},{id:uid(),key:'Priority',type:'rating',value:4}]},
    {id:uid(),folderId:f2.id,type:'habit',title:'Morning Routine',desc:'Start the day right',items:[{id:uid(),text:'Meditate 10min',done:false},{id:uid(),text:'Cold shower',done:false},{id:uid(),text:'Journal',done:false}],note:'',nf:[]},
    {id:uid(),folderId:f3.id,type:'project',title:'Portfolio Website',desc:'Redesign personal site',nf:[{id:uid(),key:'Deadline',type:'date',value:'2026-06-01'},{id:uid(),key:'Progress',type:'progress',value:35},{id:uid(),key:'Stack',type:'multi',value:['React','Tailwind','Vercel']}]},
  ];
  save();
}
