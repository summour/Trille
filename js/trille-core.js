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

function writeLocalJSON(key,value){
  localStorage.setItem(key,JSON.stringify(value));
}

function buildDemoWorkflowBoard(folderId){
  const workflowBoardId=uid();
  const captureId=uid();
  const planId=uid();
  const buildId=uid();
  const reviewId=uid();
  const launchId=uid();

  return {
    ids:{workflowBoardId,captureId,planId,buildId,reviewId,launchId},
    board:{
      id:workflowBoardId,
      folderId,
      type:'workflow',
      title:'Demo Workflow — Build a Mini App',
      desc:'A complete sample project showing cards, tasks, fields, notes, links, post-it notes, frames, text, and canvas flow.',
      tags:['demo','workflow','trille'],
      items:[
        {id:uid(),text:'Open the canvas to see the full workflow map',done:true},
        {id:uid(),text:'Tap each card to read details and tasks',done:false},
        {id:uid(),text:'Use the ⋯ menu to edit, link, or color cards',done:false}
      ],
      note:'This is sample data for learning Trille. Edit it, duplicate it, or delete it when you are ready to build your own workflow.',
      nf:[
        {id:uid(),key:'Board type',type:'select',value:'Workflow'},
        {id:uid(),key:'Progress',type:'progress',value:45},
        {id:uid(),key:'Priority',type:'rating',value:5},
        {id:uid(),key:'Reference',type:'url',value:'https://example.com'}
      ],
      subcards:[
        {
          id:captureId,
          title:'1. Capture idea',
          desc:'Write down the raw app idea before organizing it.',
          tags:['idea','inbox'],
          linkedCardIds:[planId],
          items:[
            {id:uid(),text:'Problem to solve',done:true},
            {id:uid(),text:'Target user',done:true},
            {id:uid(),text:'First simple use case',done:false}
          ],
          note:'Example: I want a small workflow tracker that helps me see what to do next.',
          nf:[
            {id:uid(),key:'Status',type:'select',value:'Done'},
            {id:uid(),key:'Energy',type:'rating',value:4}
          ]
        },
        {
          id:planId,
          title:'2. Plan scope',
          desc:'Turn the idea into a small MVP plan.',
          tags:['planning','mvp'],
          linkedCardIds:[buildId],
          items:[
            {id:uid(),text:'Define must-have features',done:true},
            {id:uid(),text:'Remove nice-to-have features',done:false},
            {id:uid(),text:'Choose one screen to build first',done:false}
          ],
          note:'Keep the first version small. Stable behavior first.',
          nf:[
            {id:uid(),key:'Owner',type:'person',value:'Me'},
            {id:uid(),key:'Progress',type:'progress',value:50},
            {id:uid(),key:'Due',type:'date',value:'2026-05-10'}
          ]
        },
        {
          id:buildId,
          title:'3. Build UI',
          desc:'Create the first usable version with simple controls.',
          tags:['build','ui'],
          linkedCardIds:[reviewId],
          items:[
            {id:uid(),text:'Create board page',done:true},
            {id:uid(),text:'Add card modal',done:true},
            {id:uid(),text:'Save data to local storage',done:false}
          ],
          note:'Avoid hidden gestures first. Use visible buttons and clear states.',
          nf:[
            {id:uid(),key:'Stack',type:'multi',value:['HTML','CSS','JavaScript']},
            {id:uid(),key:'Progress',type:'progress',value:65},
            {id:uid(),key:'Blocked?',type:'check',value:false}
          ]
        },
        {
          id:reviewId,
          title:'4. Review flow',
          desc:'Check if the workflow is understandable without instructions.',
          tags:['review','ux'],
          linkedCardIds:[launchId],
          items:[
            {id:uid(),text:'Tap every main button',done:false},
            {id:uid(),text:'Check mobile spacing',done:false},
            {id:uid(),text:'Confirm card links make sense',done:true}
          ],
          note:'Use this step to find confusing screens before adding more features.',
          nf:[
            {id:uid(),key:'Status',type:'select',value:'In Progress'},
            {id:uid(),key:'Issues found',type:'number',value:2}
          ]
        },
        {
          id:launchId,
          title:'5. Launch small',
          desc:'Ship the small version and collect real usage feedback.',
          tags:['ship','feedback'],
          linkedCardIds:[],
          items:[
            {id:uid(),text:'Export backup JSON',done:false},
            {id:uid(),text:'Use it for one real project',done:false},
            {id:uid(),text:'Write down what feels slow',done:false}
          ],
          note:'After launch, add analytics only if the daily workflow is already clear.',
          nf:[
            {id:uid(),key:'Launch date',type:'date',value:'2026-05-15'},
            {id:uid(),key:'Confidence',type:'rating',value:3}
          ]
        }
      ]
    }
  };
}

function seedDemoCanvasProject(boardId,ids){
  const scope=`board:${boardId}`;
  const pos={
    [ids.captureId]:{x:40,y:130,layer:120},
    [ids.planId]:{x:330,y:130,layer:120},
    [ids.buildId]:{x:620,y:130,layer:120},
    [ids.reviewId]:{x:330,y:430,layer:120},
    [ids.launchId]:{x:620,y:430,layer:120}
  };
  const colors={
    [ids.captureId]:'yellow',
    [ids.planId]:'blue',
    [ids.buildId]:'green',
    [ids.reviewId]:'purple',
    [ids.launchId]:'orange'
  };
  const frames=[
    {id:uid(),x:20,y:88,w:270,h:250,label:'Start here',layer:20},
    {id:uid(),x:310,y:88,w:580,h:250,label:'Plan → Build',layer:20},
    {id:uid(),x:310,y:388,w:580,h:250,label:'Review → Launch',layer:20}
  ];
  const sticky=[
    {id:uid(),x:40,y:430,w:210,h:150,text:'Canvas tips\n\nTap card = open detail\nHold card = move\n⋯ menu = edit/link/color',color:'yellow',layer:220},
    {id:uid(),x:930,y:130,w:210,h:145,text:'Use frames to group work by phase.\n\nUse post-it notes for context that is not a task.',color:'blue',layer:220},
    {id:uid(),x:930,y:430,w:210,h:145,text:'Real usage idea:\nkeep one canvas per project, then split work into linked cards.',color:'green',layer:220}
  ];
  const text=[
    {id:uid(),x:26,y:36,w:760,h:40,text:'Sample Canvas Project: from raw idea to small launch',fontSize:24,bold:true,layer:230},
    {id:uid(),x:26,y:72,w:620,h:28,text:'This board is intentionally detailed so new users can understand the flow by opening the canvas.',fontSize:15,bold:false,layer:230}
  ];
  const shapes=[
    {id:uid(),x:520,y:340,w:90,h:60,shape:'diamond',color:'#fff7ed',strokeColor:'#f59e0b',layer:180},
    {id:uid(),x:918,y:86,w:240,h:548,shape:'rect',color:'rgba(255,255,255,.38)',strokeColor:'#d4d4d8',layer:30}
  ];
  const lines=[
    {id:uid(),x1:565,y1:340,x2:455,y2:430,style:'arrow',color:'#888'},
    {id:uid(),x1:565,y1:340,x2:665,y2:430,style:'arrow',color:'#888'}
  ];

  writeLocalJSON(`t-canvas-pos:${scope}`,pos);
  writeLocalJSON(`t-canvas-colors:${scope}`,colors);
  writeLocalJSON(`t-canvas-sticky:${scope}`,sticky);
  writeLocalJSON(`t-canvas-text:${scope}`,text);
  writeLocalJSON(`t-canvas-shapes:${scope}`,shapes);
  writeLocalJSON(`t-canvas-lines:${scope}`,lines);
  writeLocalJSON(`t-canvas-frames:${scope}`,frames);
  writeLocalJSON(`t-canvas-uploads:${scope}`,[]);
}

function findOrCreateProjectsFolder(){
  const existing=folders.find(f=>f.name==='Projects');
  if(existing)return existing;
  const folder={id:uid(),name:'Projects'};
  folders.push(folder);
  return folder;
}

function createSampleProject(){
  const folder=findOrCreateProjectsFolder();
  const demo=buildDemoWorkflowBoard(folder.id);
  cards.push(demo.board);
  seedDemoCanvasProject(demo.board.id,demo.ids);
  save();
  if(typeof renderTypeGrid==='function')renderTypeGrid();
  if(typeof openCanvas==='function')openCanvas(demo.board.id);
}

function loadDefaults(){
  const f1={id:uid(),name:'Study'};
  const f2={id:uid(),name:'Personal'};
  const f3={id:uid(),name:'Projects'};
  const demo=buildDemoWorkflowBoard(f3.id);

  folders=[f1,f2,f3];
  cards=[
    demo.board,
    {
      id:uid(),
      folderId:f1.id,
      type:'habit',
      title:'Daily Study Routine',
      desc:'Low-load daily study loop',
      tags:['study','daily'],
      items:[
        {id:uid(),text:'English input 20 min',done:true},
        {id:uid(),text:'Data practice 30 min',done:false},
        {id:uid(),text:'Review one law topic',done:false}
      ],
      note:'Use cards as small loops you can check daily.',
      nf:[
        {id:uid(),key:'Best slot',type:'text',value:'08:00 – 10:00'},
        {id:uid(),key:'Progress',type:'progress',value:35}
      ],
      subcards:[]
    },
    {
      id:uid(),
      folderId:f1.id,
      type:'focus',
      title:'Exam Prep Sprint',
      desc:'Track deadline, status, and next actions.',
      tags:['exam','focus'],
      items:[
        {id:uid(),text:'Read core summary',done:true},
        {id:uid(),text:'Do practice questions',done:false},
        {id:uid(),text:'Review mistakes',done:false}
      ],
      note:'Fields are useful for dates, progress, priority, and status.',
      nf:[
        {id:uid(),key:'D-Day',type:'date',value:'2026-07-05'},
        {id:uid(),key:'Status',type:'select',value:'In Progress'},
        {id:uid(),key:'Priority',type:'rating',value:4},
        {id:uid(),key:'Progress',type:'progress',value:60}
      ],
      subcards:[]
    },
    {
      id:uid(),
      folderId:f2.id,
      type:'personal',
      title:'Personal Reset',
      desc:'A simple board for health and life admin.',
      tags:['personal','reset'],
      items:[
        {id:uid(),text:'Clean workspace',done:false},
        {id:uid(),text:'Plan meals',done:false},
        {id:uid(),text:'Sleep before midnight',done:false}
      ],
      note:'You can create a board for anything: routines, projects, study, or ideas.',
      nf:[
        {id:uid(),key:'Mood',type:'select',value:'Good'},
        {id:uid(),key:'Energy',type:'rating',value:3}
      ],
      subcards:[]
    }
  ];
  seedDemoCanvasProject(demo.board.id,demo.ids);
  save();
}
