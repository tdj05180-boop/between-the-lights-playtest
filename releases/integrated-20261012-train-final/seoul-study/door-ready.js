const frame=document.querySelector('#fixture'),out=document.querySelector('#report');
document.querySelector('#repeat').onclick=async()=>{
 const reports=[];out.textContent='running';try{for(let i=0;i<10;i++){
  const mobile=i>=5;frame.width=mobile?844:1100;frame.height=mobile?390:690;
  const done=new Promise(resolve=>{const receive=e=>{if(e.source===frame.contentWindow&&e.data?.kind==='door-first-frame'){removeEventListener('message',receive);resolve(e.data);}};addEventListener('message',receive);});
  frame.src='./door-fixture.html?run='+Date.now()+'&mobile='+mobile;
  const result=await done;reports.push(result);out.textContent=JSON.stringify({status:'running',reports},null,2);if(!result.passed)throw Error(result.error);
 }out.textContent=JSON.stringify({status:'passed',reports},null,2);}catch(e){out.textContent=JSON.stringify({status:'failed',reports,error:e.message},null,2);}
};