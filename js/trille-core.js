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
  const f1={id:uid(),name:'Study'};
  const f2={id:uid(),name:'Personal'};
  const f3={id:uid(),name:'Projects'};

  const workflowBoardId=uid();
  const captureId=uid();
  const planId=uid();
  const buildId=uid();
  const reviewId=uid();
  const launchId=uid();

  folders=[f1,f2,f3];
  cards=[
    {
      id:workflowBoardId,
      folderId:f3.id,
      type:'workflow',
      title:'Demo Workflow — Build a Mini App',
      desc:'A complete sample board showing cards, tasks, fields, notes, hashtags, links, and workflow connections.',
      tags:['demo','workflow','trille'],
      items:[
        {id:uid(),text:'Open each card menu to edit, duplicate, or delete',done:false},
        {id:uid(),text:'Use + Add card to create another workflow step',done:false},
        {id:uid(),text:'Edit a card and link it to another card',done:true}
      ],
      note:'This board is only sample data. Edit or delete it when you are ready to build your own workflow.',
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
          note:'After launch, add analytics or canvas only if the daily workflow is already clear.',
          nf:[
            {id:uid(),key:'Launch date',type:'date',value:'2026-05-15'},
            {id:uid(),key:'Confidence',type:'rating',value:3}
          ]
        }
      ]
    },
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
  save();
}
