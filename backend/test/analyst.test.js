require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const { server } = require('../index');
const mongoose = require('mongoose');

describe('Analyst API', () => {
    let articleId;
    beforeAll(async () => {
      console.log(`${process.env.NODE_ENV} running`);
      await Article.deleteMany({}); // Clear the articles
  
    });

    afterAll(async () => {
        await mongoose.connection.close();
        if (['test', 'development'].includes(process.env.NODE_ENV)) {
          server.close();
        }
      });

      // Testing for moderator/test route 
     it('should return moderator route testing! for GET /api/analyst/test', async () => {
    const res = await request(server).get('/api/analyst/test');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('analyst route testing!');
    });

    // Testing whether the user with no analyst role getting access denied from the page
  it('should return 403 if not a moderator for GET /api/analyst', async () => {
    const res = await request(server).get('/api/analyst'); // No user-role header
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toEqual('Access Denied: You are not an Analyst!');
  });

 

  // Testing GET /api/moderator/archive
  it('should list ALL articles in the archive on /api/moderator/archive GET', async () => {
    // Delete all the articles to make Moderation Queue empty
    await Article.deleteMany({});
    // Create one article rejected by Moderator for testing
    await Article.create({
      title: 'Rejected by Moderator',
      authors: 'michael',
      journalName: 'Test',
      pubYear: '1',
      volume: '1',
      pages: '1',
      doi: 'Test',
      claims: 'Test',
      method: 'Test',
      isRejectedByModerator: true,
    });

    // Create one article rejected by Analyst for testing
    await Article.create({
      title: 'Rejected by Analyst',
      authors: 'michael',
      journalName: 'Test',
      pubYear: '1',
      volume: '1',
      pages: '1',
      doi: 'Test',
      claims: 'Test',
      method: 'Test',
      isRejectedByAnalyst: true,
    });

    const res = await request(server).get('/api/moderator/archive').set('user-role', 'Moderator'); // Include user-role header
    expect(res.status).toEqual(200);
    expect(res.body).toHaveLength(2); // We have added two articles to the archive, so we expect the length of res.body to be 2
    expect(res.body.some(article => article.title === 'Rejected by Moderator')).toBeTruthy();
    expect(res.body.some(article => article.title === 'Rejected by Analyst')).toBeTruthy();
  });

   // Testing whether the page shows only one article when it has been added one article in the queue
  it('should list ALL articles in the analyst queue on /api/analyst GET', async () => {
    //clear queue for testing
    await Article.deleteMany({});

    // Create one article for testing
    await Article.create({
      title: 'Test Article',
      authors: 'michael',
      journalName: 'Test',
      pubYear: '1',
      volume: '1',
      pages: '1',
      doi: 'Test',
      claims: 'Test',
      method: 'Test',
      isApprovedByModerator: true,
      });

    const res = await request(server).get('/api/analyst').set('user-role', 'Analyst'); // Include user-role header
    expect(res.status).toEqual(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toEqual('Test Article');
  });

  // Testing whether the page shows empty list after the deletion of all articles
  it('should return appropriate error message if no articles in the analysis queue', async () => {
    // Delete all the articles to make Analyst Queue empty
    await Article.deleteMany({});

    const res = await request(server).get('/api/analyst').set('user-role', 'Analyst'); // Include user-role heade

    // console.log(res.body);

    expect(res.status).toEqual(404);
    expect(res.body.noarticlesfound).toEqual('No Articles found in the analysis queue');
  });

  // Testing PUT /api/analyst/approve/:id
  it('should successfully approve an article in the analysis queue', async () => {
    const newArticle = await Article.create({
      title: 'Test Article',
      authors: 'michael',
      journalName: 'Test',
      pubYear: '1',
      volume: '1',
      pages: '1',
      doi: 'Test',
      claims: 'Test',
      method: 'Test',
      isApprovedByModerator: true,
      isRejectedByModerator: false,
    });
    articleId = newArticle._id;
    const res = await request(server).put(`/api/analyst/approve/${articleId}`).set('user-role', 'Analyst'); // Include user-role header
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('msg', 'Updated successfully');
  });

  it('should return error when trying to approve non-existent article', async () => {
    const res = await request(server).put('/api/analyst/approve/nonexistentid').set('user-role', 'Analyst'); // Include user-role header
    expect(res.status).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Unable to update the Database');
  });

    
  it('should return 403 if not a moderator for GET /api/moderator/archive', async () => {
    const res = await request(server).get('/api/moderator/archive'); // No user-role header
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toEqual('Access Denied: You are not a Moderator!');
  });

  it('should return appropriate error message if no articles in the archive', async () => {
    // Delete all the articles to make Archive empty
    await Article.deleteMany({});

    const res = await request(server).get('/api/moderator/archive').set('user-role', 'Moderator'); // Include user-role header
    expect(res.status).toEqual(404);
    expect(res.body.noarticlesfound).toEqual('No Articles found in the archive');
  });
  });