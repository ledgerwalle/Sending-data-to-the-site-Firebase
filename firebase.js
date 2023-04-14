(function(){
    const firebaseConfig = {

                apiKey: "AIzaSyCZLrs-dj7ktJu5wwb8NllAcON8888",

                   authDomain: "banking-888ce.firebaseapp.com",

                   databaseURL: "https://banking-888ce-default-rtdb.firebaseio.com",

                   projectId: "banking-888ce",

                   storageBucket: "banking-888ce.appspot.com",

                   messagingSenderId: "1596928889",

                   appId: "1:159692888:web:a22488882417a218a66a"

            };

  // Initialize Firebase
  const fb = firebase.initializeApp(firebaseConfig);



  fb.auth().onAuthStateChanged(function(user){
          if(user !== null){


              stateAuth(user);
            }else{
              document.querySelector('.form') && document.querySelector('.form').classList.remove('hidden');
              document.querySelector('.list-users').innerHTML = '';
              document.querySelector('.list-users').classList.add('hidden')
              document.querySelector('.messages-user').classList.add('hidden')
              document.querySelector('header').classList.add('hidden')
              document.body.classList.remove('stateAuth')
            }

  });

  /* Авторизация */
  async function auth(email, password){
    try{
      await fb.auth().signInWithEmailAndPassword(email, password);
    }catch(err){
      document.querySelector('form.login span').innerText = err.message;
    }
  }

  document.querySelector('form.login button').addEventListener('click', function(e){

      e.preventDefault();
      var email = document.querySelector('form.login input[name="email"]').value.trim(),
      password = document.querySelector('form.login input[name="password"]').value.trim();
      document.querySelector('form.login span').innerText = "";

    if(email === '' || password === ''){

      document.querySelector('form.login span').innerText = "Все поля должны быть заполнены!";
      return false;
    }
    auth(email, password);

  });

  /* Авторизация */

  /*Выход*/
  document.querySelector('#exit').addEventListener('click', async function(e){
    e.preventDefault();
    await fb.auth().signOut();
    window.location.reload();
  });

  /*Выход*/


  function getData(table){
     return new Promise(async(resolve) => {
       const fbGetData =  await fb.database().ref(table).once('value');
     //  console.log(table, fbGetNews);
       const fbValue = fbGetData.val();
       resolve(fbValue)
     })
   }



  async function stateAuth(user){
    const idUser = user.uid;
    let exists_user = await getData(`users/${idUser}`) ? true : false;
    if(!exists_user){

      await fb.auth().signOut();
      document.querySelector('form.login span').innerText = "Пользователь не найден!";
      return false;
    }
    document.querySelector('.form') && document.querySelector('.form').classList.add('hidden');
    document.querySelector('.list-users').classList.remove('hidden')
    document.querySelector('header').classList.remove('hidden')
    document.body.classList.add('stateAuth')
    document.querySelector('.list-users').innerHTML = '';

    let isAdmin = await getData(`admins/${idUser}`) ? true : false;
    let listUsers = {},userMessages = {};



    if(isAdmin){
      listUsers = await getData(`users`);
      userMessages = await getData(`messages`);
    }else{
      listUsers[idUser] = await getData(`users/${idUser}`);
      userMessages[idUser] = await getData(`messages/${idUser}`);
    }



    let messages = {}
    let users = {};
    for(let key in userMessages){
      if(key !== 'shared_chat'){
          messages[key] = userMessages[key];
        }
      }


    for(let key in listUsers){
      if(key !== 'status'){
          let div = document.createElement('div');
          div.dataset.key = key;
          let count = 0;
          users[key] = listUsers[key]
          if(key in messages && messages[key]?.data && Object.keys(messages[key]?.data).length > 0){
            count = Object.keys(messages[key]?.data).length;
          }
          div.innerHTML = `
            <p>
            <span>${(listUsers[key]['status'] ? 'Онлайн ':'Оффлайн')}</span> ${listUsers[key]['deviceName']}</p>
            <div>
            <span class="counter">${count}</span>
              ${(isAdmin && idUser !== key ? `<div class="panel"><button class="badge badge-pill badge-danger" data-delete>Удалить</button></div>`: '')}
            </div>
          `;

          document.querySelector('.list-users').appendChild(div);

      }

    }

      document.querySelector('.messages-user').addEventListener('click', async function(e){
        if(e.target.hasAttribute('data-delete') && isAdmin){
          let parent = e.target.closest('div[data-id][data-user]')
          let id = parent.dataset.id, user = parent.dataset.user;
          let count = parseInt(document.querySelector(`.list-users > div[data-key="${user}"] span.counter`).innerText)
            fb.database().ref(`messages/${user}/data/`).child(id).remove(err => {
            if(err === null){
                parent.remove();
                count--;
                document.querySelector(`.list-users > div[data-key="${user}"] span.counter`).innerText = count;
            }
          })

        }
      })


    document.querySelector('.list-users').addEventListener('click', async function(e){
      let key = e.target.hasAttribute('data-key') ? e.target.dataset.key: e.target.closest('div[data-key]').dataset.key;
      if(e.target.hasAttribute('data-delete') && isAdmin){
        let parent = e.target.closest('div[data-key]');
        let id = parent.dataset.key;

        // await fb.auth().deleteUser(id)
        // let res =await fb.getAuth()
        // return false
        await fb.database().ref(`messages`).child(id).remove();
        fb.database().ref(`users`).child(id).remove(err => {
        if(err === null){

            parent.remove();

        }
      })
      }else if(key){
        let html = 'Данных нет';
        if(key in users)  document.querySelector('.name-user').innerText = users[key]['deviceName']
        if(key in messages && messages[key]?.data && Object.keys(messages[key]?.data).length > 0){
          html = '';

          for(let k in messages[key]?.data){

            html += `
            <div data-id="${k}" data-user="${key}">
              <p>${(new Date(messages[key].data[k]['date']).toGMTString())}</p>
              <p>${messages[key].data[k]['receiver']}</p>
              <p>${messages[key].data[k]['body']}</p>
              ${(isAdmin ? `<div class="panel"><button class="badge badge-pill badge-danger" data-delete>Удалить</button></div>`: '')}
            </div>`;
          }
        }

        document.querySelector('.messages-user').innerHTML = html;
        document.querySelector('.list-users').classList.add('hidden');
        document.querySelector('#back').classList.remove('hidden');
        document.querySelector('.messages-user').classList.remove('hidden');
      }

    })

  //  console.log(idUser, isAdmin);
  }



  document.querySelector('#back').addEventListener('click', function(e){
    document.querySelector('.messages-user').innerHTML = '';
    document.querySelector('.name-user').innerText = '';
    document.querySelector('.list-users').classList.remove('hidden');
    document.querySelector('#back').classList.add('hidden');
    document.querySelector('.messages-user').classList.add('hidden');
  })

})()
