// يعوّض firebase-auth في الاختبارات: المستعمل داخل من الأول، و الداتابيز الحقيقية (emulator) تشوفو بالـ uid متاعو.
(function(){
  var U = window.__ROLE_USER;
  function mkAuth(user){ var cbs=[]; return { get currentUser(){return user;},
    onAuthStateChanged:function(cb){ cbs.push(cb); setTimeout(function(){cb(user);},20); return function(){}; },
    signInWithEmailAndPassword:function(e){ return Promise.resolve({user:{email:e,uid:'x',updatePassword:function(){return Promise.resolve();},updateEmail:function(){return Promise.resolve();}}}); },
    createUserWithEmailAndPassword:function(e){ return Promise.resolve({user:{uid:'new_'+e,email:e}}); },
    signOut:function(){ user=null; cbs.forEach(function(c){c(null);}); return Promise.resolve(); },
    setPersistence:function(){return Promise.resolve();}, sendPasswordResetEmail:function(){return Promise.resolve();}, useEmulator:function(){} }; }
  var MAIN = mkAuth(U ? {email:U.email, uid:U.uid} : null);
  var o = firebase.initializeApp;
  firebase.initializeApp = function(c, n){
    var a = o.apply(this, arguments);
    var isMain = !n || n === '[DEFAULT]';
    a.auth = function(){ return isMain ? MAIN : mkAuth(null); };
    if(isMain) a.database().useEmulator('127.0.0.1', 9000, U ? {mockUserToken:{sub:U.uid, user_id:U.uid, email:U.email}} : undefined);
    return a;
  };
  firebase.auth = function(){ return MAIN; };
  firebase.auth.Auth = {Persistence:{LOCAL:'local',SESSION:'session',NONE:'none'}};
})();
