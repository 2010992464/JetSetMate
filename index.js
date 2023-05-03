/* eslint-disable no-console */
const cookieParser = require('cookie-parser');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const url = require('url');
const fs = require('fs');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = 'mongodb+srv://sahil2070be20:dRCYTOzzbHCzfA70@travelsaathi.flubanq.mongodb.net/test';
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
client.connect();

const reconnect = async () => {
  await client.connect();
};

app.get('/getUserDetails/:token/', async (req, res) => {
  if (!client) await reconnect();
  const exsist = client
    .db('travelSaathi')
    .collection('users')
    .findOne({ token: req.params.token.slice(0, -13) });
  if (exsist) res.send({ status: 'success', exsist });
  else res.send({ status: 'error', error: 'User Token Issue' })
});
app.post('/setUserDetails/:token/', async (req, res) => {
  if (!client) await reconnect();
  client
    .db('travelSaathi')
    .collection('users')
    .updateOne(
      { token: req.params.token.slice(0, -13) },
      { $set: { data: req.body.newData } },
      (errs, data) => {
        if (errs) res.send({ status: 'error', error: 'Server error please try again later' });
        else if (data) res.send({ status: 'success', data: 'Data Saved' });
        else res.send({ status: 'error', error: 'User Token Issue' });
      },
    );
});
app.post('/auth/signup/', async (req, res) => {
  console.log(req.body);
  if (!req.body.email || !req.body.name || !req.body.password) {
    res.send({ status: 'error', error: 'Wrong API Data Sent' });
  } else {
    if (!client) await reconnect();
    const exsist = await client
      .db('travelSaathi')
      .collection('users')
      .findOne({ token: Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64') });
    if (exsist) {
      res.send({ status: 'error', error: 'User Already Exists' });
    } else {
      const status = await client
        .db('travelSaathi')
        .collection('users')
        .insertOne({
          token: Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64'), email: req.body.email, name: req.body.name, gender: req.body.gender, pNumber: req.body.pNumber,
        });
      if (status) {
        res.send({ status: 'success', data: `${Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64')}${new Date().getTime()}` });
      }
    }
  }
}
);
app.post('/login/', async (req, res) => {
  if (!client) await reconnect();
  const exsist = await client
    .db('travelSaathi')
    .collection('users')
    .findOne({ token: Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64') });
  if (exsist) {
    res.send({ status: 'success', data: `${Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64')}${new Date().getTime()}` });

  } else res.send({ status: 'error', error: 'Wrong Email or password' })
});
app.get('/feed/', async (req, res) => {
  if (fs.existsSync(`${__dirname}/views/feed.ejs`)) {
    try {
      if (req.cookies.userToken) {
        const userData =  await client
          .db('travelSaathi')
          .collection('users')
          .findOne({ token: req.cookies.userToken.slice(0, -13) });
        console.log(userData);
        const postsData = await client
        .db('travelSaathi')
        .collection('posts')
        .find();
        if (userData) res.render('feed', { userData : userData ,posts : postsData});
        else res.send({ status: 'error', error: 'User Token Issue' });
      } else {
        res.redirect('/landing');
      }
    } catch (renderError) {
      res.render('404', { error: renderError, url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
    }
  } else {
    res.render('404', { error: 'Page Does Not Exists', url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
  }
});
app.get('/:type/:view/', (req, res) => {
  if (fs.existsSync(`${__dirname}/views/${req.params.type}/${req.params.view}.ejs`)) {
    try {
      res.render(`${req.params.type}/${req.params.view}`, { url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
    } catch (renderError) {
      res.render('404', { error: renderError, url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
    }
  } else {
    res.render('404', { error: 'Page Does Not Exists', url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
  }
});
app.get('/:view/', (req, res) => {
  if (req.cookies.userToken) {
    const exsist = client
      .db('travelSaathi')
      .collection('users')
      // eslint-disable-next-line no-shadow
      .findOne({ token: req.cookies.userToken });
    if (exsist) {
      if (fs.existsSync(`${__dirname}/views/${req.params.view}.ejs`)) {
        try {
          res.render(`${req.params.view}`, { url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
        } catch (renderError) {
          res.render('404', { error: renderError, url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
        }
      } else {
        res.render('404', { error: 'Page Does Not Exists', url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
      }
    } else { res.render('landing') }
  } else { res.render('landing') }

});
app.get('/*', (req, res) => {
  if (req.cookies.userToken) {
    const exsist = client
      .db('travelSaathi')
      .collection('users')
      // eslint-disable-next-line no-shadow
      .findOne({ token: req.cookies.userToken });
    if (exsist) {
      res.redirect('/feed');
    } else { res.redirect('landing') }
  } else { res.redirect('landing') }
});

app.post('*', (req, res) => { res.send({ status: 'error', error: 'Endpoint Not Allowed' }); });

app.listen(process.env.PORT || 5001, () => {
  console.log(`Listening on port ${process.env.PORT || 5001}`);
});
