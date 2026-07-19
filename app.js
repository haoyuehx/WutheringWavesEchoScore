const API="https://api.kurobbs.com",GAME="3",CAPTCHA="ec4aa4174277d822d73f2442a165a2cd";
const SERVERS={cn:"76402e5b20be2c39f095a152090afddc",overseas:"919752ae5ea09c1ced910dd668a63ffb"};
const GRADES=["c","b","a","s","ss","sss"];
const ROVER={1501:"漂泊者·衍射",1502:"漂泊者·衍射",1604:"漂泊者·湮灭",1605:"漂泊者·湮灭",1406:"漂泊者·气动",1408:"漂泊者·气动"};
const state={token:"",devCode:random(32),accounts:[],account:null,characters:[],templates:null,captcha:null};
const $=id=>document.getElementById(id);
const el={loginView:$("loginView"),dashboard:$("dashboard"),form:$("loginForm"),phone:$("phone"),code:$("code"),send:$("sendCode"),login:$("login"),logout:$("logout"),account:$("account"),characters:$("characters"),scores:$("scores"),summary:$("summary"),echoes:$("echoes"),toast:$("toast"),loading:$("loading"),loadingText:$("loadingText")};

boot();
async function boot(){
  bind();
  try{const r=await fetch("./data/scores.json");if(!r.ok)throw Error("评分模板加载失败");state.templates=await r.json()}catch(e){notice(e.message,true)}
  try{const init=await waitFor(()=>window.initGeetest4,8000);initCaptcha(init)}catch{notice("人机验证组件加载失败，请刷新页面",true)}
}
function bind(){
  el.phone.oninput=()=>{el.phone.value=el.phone.value.replace(/\D/g,"").slice(0,11);el.send.disabled=!/^1[3-9]\d{9}$/.test(el.phone.value)};
  el.code.oninput=()=>el.code.value=el.code.value.replace(/\D/g,"").slice(0,6);
  el.send.onclick=()=>state.captcha?state.captcha.showBox():notice("人机验证尚未加载完成",true);
  el.form.onsubmit=login;
  el.account.onchange=()=>selectAccount(Number(el.account.value));
  el.logout.onclick=logout;
}
function initCaptcha(init){
  init({captchaId:CAPTCHA,product:"bind"},captcha=>{
    state.captcha=captcha;
    captcha.onSuccess(async()=>{
      const validation=captcha.getValidate();if(!validation)return notice("请先完成人机验证",true);
      validation.captcha_id=CAPTCHA;
      try{busy(true,"正在发送验证码…");const r=await request("/user/getSmsCodeForH5",{mobile:el.phone.value,geeTestData:JSON.stringify(validation)});if(!ok(r))throw Error(r.msg||"验证码发送失败");notice("验证码已发送");countdown(60)}catch(e){notice(readError(e),true);el.send.disabled=false}finally{busy(false)}
    }).onError(()=>notice("人机验证失败，请重试",true));
  });
}
async function login(event){
  event.preventDefault();const mobile=el.phone.value,code=el.code.value;
  if(!/^1[3-9]\d{9}$/.test(mobile))return notice("请输入正确的手机号",true);
  if(!/^\d{6}$/.test(code))return notice("请输入 6 位验证码",true);
  try{
    el.login.disabled=true;busy(true,"正在登录库街区…");
    const auth=await request("/user/sdkLoginForH5",{mobile,code});
    if(!ok(auth)||!auth.data?.token)throw Error(auth.msg||"登录失败，请检查验证码");
    state.token=auth.data.token;busy(true,"正在读取游戏账号…");
    const roles=await request("/gamer/role/list",{gameId:GAME},state.token);
    if(!ok(roles)||!Array.isArray(roles.data)||!roles.data.length)throw Error(roles.msg||"未找到已绑定的鸣潮账号");
    state.accounts=roles.data;renderAccounts();showDashboard();await selectAccount(0);
  }catch(e){state.token="";notice(readError(e),true)}finally{el.login.disabled=false;busy(false)}
}
async function selectAccount(index){
  const account=state.accounts[index];if(!account)return;state.account=account;el.account.value=String(index);el.scores.hidden=true;el.characters.innerHTML="";
  try{
    busy(true,"正在刷新角色数据…");const body=accountBody(account);
    const refreshed=await request("/aki/roleBox/akiBox/refreshData",body,state.token);if(!ok(refreshed))throw Error(refreshed.msg||"角色数据刷新失败");
    const result=await request("/aki/roleBox/akiBox/roleData",body,state.token);
    if(!ok(result)||!Array.isArray(result.data?.roleList))throw Error(result.msg||"角色列表读取失败，请检查库街区展示设置");
    state.characters=result.data.roleList;renderCharacters();
  }catch(e){notice(readError(e),true)}finally{busy(false)}
}
async function selectCharacter(character,button){
  document.querySelectorAll(".character.active").forEach(node=>node.classList.remove("active"));button.classList.add("active");
  try{
    busy(true,`正在读取 ${character.roleName} 的声骸…`);const body=accountBody(state.account);
    const access=await request("/aki/roleBox/requestToken",{serverId:body.serverId,roleId:body.roleId},state.token);
    const extra=access.data?.accessToken?{"b-at":access.data.accessToken}:{};
    const result=await request("/aki/roleBox/akiBox/getRoleDetail",{...body,channelId:"19",countryCode:"1",id:String(character.roleId)},state.token,extra);
    if(!ok(result)||!result.data?.role)throw Error(result.msg||"角色详情读取失败");
    renderScores(result.data);el.scores.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){notice(readError(e),true)}finally{busy(false)}
}
function renderAccounts(){el.account.innerHTML=state.accounts.map((a,i)=>`<option value="${i}">${html(a.roleName)} · ${html(a.roleId)}</option>`).join("")}
function renderCharacters(){
  if(!state.characters.length){el.characters.innerHTML="<p>库街区暂未展示角色。</p>";return}
  el.characters.innerHTML="";
  for(const char of state.characters){const button=document.createElement("button");button.type="button";button.className="character";button.innerHTML=`<img src="${url(char.rolePicUrl||char.roleIconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer"><strong>${html(char.roleName)}</strong><small>Lv.${Number(char.level||0)} · 点击评分</small>`;button.onclick=()=>selectCharacter(char,button);el.characters.append(button)}
}
function renderScores(detail){
  const echoes=detail.phantomData?.equipPhantomList?.filter(Boolean)||[];if(!echoes.length)throw Error("该角色没有可读取的声骸装备");
  const name=ROVER[detail.role.roleId]||detail.role.roleName,template=chooseTemplate(name,echoes);if(!template)throw Error(`暂未找到 ${name} 的评分模板`);
  const results=echoes.map(echo=>scoreEcho(echo,template)),total=Math.round(results.reduce((n,item)=>n+item.score,0)*10)/10,grade=gradeFor(total/250,template.total_grade);
  el.summary.innerHTML=`<img src="${url(detail.role.roleIconUrl)}" alt="" referrerpolicy="no-referrer"><div><h2>${html(detail.role.roleName)}</h2><p>${html(template.name||"角色评分模板")} · ${echoes.length} 枚声骸</p></div><span class="grade grade-${grade}">${grade}</span><div class="total"><strong>${total.toFixed(1)}</strong><span>总评分 / 250</span></div>`;
  el.echoes.innerHTML=echoes.map((echo,i)=>renderEcho(echo,results[i])).join("");el.scores.hidden=false;
}
function renderEcho(echo,result){const props=[...(echo.mainProps||[]),...(echo.subProps||[])];return `<article class="echo"><div class="echo-head"><img src="${url(echo.phantomProp?.iconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer"><div><strong>${html(echo.phantomProp?.name||"声骸")}</strong><small>COST ${Number(echo.cost)} · +${Number(echo.level)}</small></div></div><div class="echo-score"><strong>${result.score.toFixed(1)}</strong><span class="grade grade-${result.grade}">${result.grade}</span></div><ul class="props">${props.map(p=>`<li><span>${html(p.attributeName)}</span><b>${html(p.attributeValue)}</b></li>`).join("")}</ul></article>`}
function chooseTemplate(name,echoes){
  if(!state.templates)return null;const group=state.templates.characters[name]||state.templates.characters.default;let file="calc.json",conditions=group["condition-user.json"]||group["condition.json"];
  if(conditions){const sonata=echoes[0]?.fetterDetail?.name,match=conditions.find(c=>c.key==="ph"&&c.op==="="&&c.value===sonata);if(match)file=match.choose}
  return group[file]||group["calc.json"]||state.templates.characters.default["calc.json"];
}
function scoreEcho(echo,template){const props=[...(echo.mainProps||[]),...(echo.subProps||[])],raw=props.reduce((n,p,i)=>n+scoreProp(p,i,Number(echo.cost),template),0),index=Number(echo.cost)===1?0:Number(echo.cost)===3?1:2,max=Number(template.score_max[index]),ratio=max?raw/max:0;return{score:Math.round(ratio*500)/10,grade:gradeFor(ratio,template.props_grade[index])}}
function scoreProp(prop,index,cost,t){
  const weights=index<2?t.main_props[String(cost)]:t.sub_props;if(!weights)return 0;const percent=String(prop.attributeValue).includes("%"),value=parseFloat(String(prop.attributeValue).replace("%",""))||0,name=prop.attributeName;
  if(["攻击","生命","防御"].includes(name))return Number(weights[percent?`${name}%`:name]||0)*value;
  const skill={"普攻伤害加成":0,"重击伤害加成":1,"共鸣技能伤害加成":2,"共鸣解放伤害加成":3}[name];if(skill!==undefined)return Number(weights["技能伤害加成"]||0)*Number(t.skill_weight?.[skill]||0)*value;
  if(["冷凝","衍射","导电","热熔","气动","湮灭"].includes(name.slice(0,2)))return Number(weights["属性伤害加成"]||0)*value;return Number(weights[name]||0)*value;
}
function gradeFor(ratio,limits=[]){let index=0;limits.forEach((limit,i)=>{if(ratio>=Number(limit))index=i});return GRADES[Math.min(index,5)]}
async function request(path,body,token="",extra={}){const headers={source:"h5",devCode:state.devCode,"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",...extra};if(token)headers.token=token;const response=await fetch(API+path,{method:"POST",headers,body:new URLSearchParams(Object.entries(body).map(([k,v])=>[k,String(v)])),credentials:"omit"});if(!response.ok)throw Error(`库街区接口请求失败（HTTP ${response.status}）`);const result=await response.json();if(typeof result.data==="string"){try{result.data=JSON.parse(result.data)}catch{}}return result}
function accountBody(a){const roleId=String(a.roleId);return{gameId:GAME,serverId:a.serverId||(Number(roleId)>=2e8?SERVERS.overseas:SERVERS.cn),roleId}}
function ok(r){return Number(r?.code)===200}function showDashboard(){el.loginView.hidden=true;el.dashboard.hidden=false;el.logout.hidden=false}function logout(){Object.assign(state,{token:"",accounts:[],account:null,characters:[]});el.code.value="";el.dashboard.hidden=true;el.loginView.hidden=false;el.logout.hidden=true;el.scores.hidden=true}
function busy(show,text="正在加载…"){el.loadingText.textContent=text;el.loading.hidden=!show}function notice(message,error=false){el.toast.textContent=message;el.toast.classList.toggle("error",error);el.toast.hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.toast.hidden=true,5000)}
function countdown(seconds){el.send.disabled=true;const timer=setInterval(()=>{el.send.textContent=`${seconds--} 秒`;if(seconds<0){clearInterval(timer);el.send.textContent="重新获取";el.send.disabled=false}},1000)}
function random(length){const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";return Array.from({length},()=>chars[Math.floor(Math.random()*chars.length)]).join("")}
function waitFor(get,timeout){return new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{const value=get();if(value){clearInterval(timer);resolve(value)}else if(Date.now()-start>timeout){clearInterval(timer);reject(Error("timeout"))}},80)})}
function readError(e){return e instanceof TypeError&&/fetch/i.test(e.message)?"无法连接库街区接口，可能是网络或跨域策略发生变化":e?.message||"发生未知错误"}
function html(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c])}function url(value){try{const u=new URL(value);return["http:","https:"].includes(u.protocol)?html(u.href):""}catch{return""}}
