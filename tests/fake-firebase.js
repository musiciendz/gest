// Firebase وهمي في الذاكرة باش نجرّبو index.html بلا ما نمسّو الداتابيز الحقيقية.
(function(){
  var DATA = window.__FAKE_DATA || {};
  var listeners = [];
  function get(path){ var parts=path.split('/').filter(Boolean), cur=DATA; for(var i=0;i<parts.length;i++){ if(cur==null||typeof cur!=='object') return null; cur=cur[parts[i]]; } return cur===undefined?null:JSON.parse(JSON.stringify(cur)); }
  function setp(path,val){ var parts=path.split('/').filter(Boolean), cur=DATA; for(var i=0;i<parts.length-1;i++){ if(cur[parts[i]]==null||typeof cur[parts[i]]!=='object') cur[parts[i]]={}; cur=cur[parts[i]]; } var k=parts[parts.length-1]; var before=JSON.stringify(cur[k]===undefined?null:cur[k]); window.__wpaths=window.__wpaths||{}; window.__wpaths[path]=(window.__wpaths[path]||0)+1; if(val==null) delete cur[k]; else cur[k]=JSON.parse(JSON.stringify(val)); if(JSON.stringify(cur[k]===undefined?null:cur[k])===before) return; fire(path); }
  function fire(path){ listeners.forEach(function(l){ if(path.indexOf(l.path)===0||l.path.indexOf(path)===0) setTimeout(function(){ l.cb(snap(l.path)); },0); }); window.__writes=(window.__writes||0)+1; }
  function snap(path){ var v=get(path); return { val:function(){return v;}, exists:function(){return v!=null;}, key:path.split('/').pop(), forEach:function(f){ if(v&&typeof v==='object') Object.keys(v).forEach(function(k){ f(snap(path+'/'+k)); }); }, child:function(c){return snap(path+'/'+c);}, numChildren:function(){return v&&typeof v==='object'?Object.keys(v).length:0;}, hasChild:function(c){return !!(v&&v[c]!=null);} }; }
  var n=0;
  function ref(path){ path=(path||'').replace(/\/+$/,''); var r={
    key: path.split('/').pop(),
    on:function(ev,cb){ listeners.push({path:path,cb:cb}); setTimeout(function(){cb(snap(path));},5); return cb; },
    off:function(){}, once:function(ev,cb){ var s=snap(path); if(cb) setTimeout(function(){cb(s);},0); return Promise.resolve(s); },
    set:function(v){ setp(path,v); return Promise.resolve(); },
    update:function(o){ Object.keys(o).forEach(function(k){ setp(path+'/'+k,o[k]); }); return Promise.resolve(); },
    remove:function(){ setp(path,null); return Promise.resolve(); },
    push:function(v){ var k='k'+(Date.now())+(n++); var c=ref(path+'/'+k); var p=v!==undefined?c.set(v):Promise.resolve(); c.then=p.then.bind(p); c.catch=p.catch.bind(p); return c; },
    child:function(c){ return ref(path+'/'+c); },
    transaction:function(f){ var nv=f(get(path)); setp(path,nv); return Promise.resolve({committed:true,snapshot:snap(path)}); },
    onDisconnect:function(){ return {set:function(){return Promise.resolve();},remove:function(){return Promise.resolve();},update:function(){return Promise.resolve();},cancel:function(){}}; }
  }; ['orderByChild','orderByKey','orderByValue','equalTo','limitToLast','limitToFirst','startAt','endAt'].forEach(function(m){ r[m]=function(){return r;}; }); return r; }
  var user = window.__FAKE_USER || null; var authCbs=[];
  function mkAuth(){ return { get currentUser(){return user;}, onAuthStateChanged:function(cb){ authCbs.push(cb); setTimeout(function(){cb(user);},20); return function(){}; },
    signInWithEmailAndPassword:function(e){ user={email:e,uid:'u_'+e}; authCbs.forEach(function(c){c(user);}); return Promise.resolve({user:user}); },
    createUserWithEmailAndPassword:function(e){ return Promise.resolve({user:{uid:'new_'+e,email:e,updatePassword:function(){return Promise.resolve();}}}); },
    signOut:function(){ user=null; authCbs.forEach(function(c){c(null);}); return Promise.resolve(); }, setPersistence:function(){return Promise.resolve();} , sendPasswordResetEmail:function(){return Promise.resolve();} }; }
  var authSingleton=mkAuth();
  function mkApp(name){ return { name:name, options:{}, database:function(){return db;}, auth:function(){return name==='[DEFAULT]'?authSingleton:mkAuth();}, delete:function(){return Promise.resolve();} }; }
  var db={ ref:ref, goOnline:function(){}, goOffline:function(){} };
  var apps=[];
  window.firebase={ apps:apps, initializeApp:function(c,name){ var a=mkApp(name||'[DEFAULT]'); apps.push(a); return a; },
    app:function(name){ name=name||'[DEFAULT]'; var a=apps.filter(function(x){return x.name===name;})[0]; if(!a) throw new Error('no app'); return a; },
    database:function(){return db;}, auth:function(){return authSingleton;} };
  window.firebase.database.ServerValue={TIMESTAMP:Date.now()};
  window.firebase.auth.Auth={Persistence:{LOCAL:'local',SESSION:'session',NONE:'none'}};
})();
