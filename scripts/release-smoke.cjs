/* Uses the configured SMOKE_TEST account and real JPEG. Never logs credentials/tokens. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const dotenv = require('dotenv');
const root = path.resolve(__dirname, '..');
for (const file of ['.env', '.env.local']) dotenv.config({ path: path.join(root, file), override: true, quiet: true });
const base = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
const fixtureFile = process.env.RELEASE_FIXTURE_FILE || '/tmp/digitimes-release-fixture.json';
const options = new Set(process.argv.slice(2));
let session;
const created = { storyIds: [], photoPaths: [], issueIds: [] };
async function api(route, method='GET', body, authenticated=true, extra={}) {
  const headers = { apikey:key, ...(authenticated && session ? {Authorization:`Bearer ${session.access_token}`} : {}), ...extra };
  if (body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${base}${route}`, {method, headers, body: body instanceof Buffer ? body : body ? JSON.stringify(body) : undefined});
  const text = await response.text();
  let data; try { data=JSON.parse(text); } catch { data=text; }
  return { ok:response.ok, status:response.status, data };
}
async function required(route, method, body, authenticated, headers) {
 const response = await api(route,method,body,authenticated,headers);
 assert(response.ok, `${method || 'GET'} ${route.split('?')[0]} returned ${response.status}`);
 return response.data;
}
async function cleanup() {
 for (const id of created.issueIds) await required(`/rest/v1/issues?id=eq.${id}&created_by=eq.${session.user.id}`, 'DELETE');
 for (const id of created.storyIds) await required(`/rest/v1/story_archives?id=eq.${id}&created_by=eq.${session.user.id}`, 'DELETE');
 if (created.photoPaths.length) await required('/storage/v1/object/photos','DELETE',{prefixes:created.photoPaths});
 console.log('Synthetic test records and uploads cleaned up.');
}
(async () => {
 assert(base && key && process.env.SMOKE_TEST_EMAIL && process.env.SMOKE_TEST_PASSWORD, 'Missing configured test account or public Supabase configuration.');
 session = await required('/auth/v1/token?grant_type=password','POST',{email:process.env.SMOKE_TEST_EMAIL,password:process.env.SMOKE_TEST_PASSWORD},false);
 assert(session.access_token && session.user?.id, 'Test-account sign-in failed.');
 console.log('PASS: test-account sign-in.');
 if (options.has('--cleanup')) {
   const fixture=JSON.parse(fs.readFileSync(fixtureFile,'utf8'));
   assert.equal(fixture.ownerId, session.user.id, 'Fixture does not belong to this test account.');
   Object.assign(created,fixture.created); await cleanup(); fs.unlinkSync(fixtureFile); return;
 }
 require('ts-node').register({ transpileOnly:true, compilerOptions:{module:'commonjs',moduleResolution:'node'} });
 global.window = {};
 global.localStorage = { getItem: () => JSON.stringify(session) };
 const { setStoryVisibility, createIssue, fetchIssueById } = require('../src/lib/storiesApi');
 let keep = false;
 try {
   const image = fs.readFileSync(path.join(root,'public/images/placeholders/newspapers1.jpeg'));
   const photoPath=`stories/${session.user.id}/release-${randomUUID()}.jpeg`;
   await required(`/storage/v1/object/photos/${photoPath}`,'POST',image,true,{'Content-Type':'image/jpeg'});
   created.photoPaths.push(photoPath);
   const photoUrl=`${base}/storage/v1/object/public/photos/${photoPath}`;
   const fetchedImage=await fetch(photoUrl); assert(fetchedImage.ok,'Uploaded real JPEG is not readable.');
   const bytes=Buffer.from(await fetchedImage.arrayBuffer()); assert.deepEqual(bytes,image);
   console.log('PASS: real JPEG upload and byte-for-byte download.');
   const articles = ['A picnic became a favorite family memory. Everyone gathered together to celebrate the small moments.', 'A private birthday memory that must never be returned to anonymous story readers.'];
   const stories=[];
   for (let index=0; index<2; index++) {
     const [story] = await required('/rest/v1/story_archives?select=*','POST',{
       created_by:session.user.id,title:index ? 'Release check: private birthday' : 'Release check: family picnic',
       article:`<p>${articles[index]}</p>`,prompt:articles[index],image_path:photoPath,is_public:false,
     },true,{Prefer:'return=representation'});
     assert(story?.id,'Story insert returned no row.'); created.storyIds.push(story.id); stories.push(story);
   }
   for (const story of stories) assert.equal((await required(`/rest/v1/story_archives?id=eq.${story.id}&select=id`,undefined,undefined,false)).length,0,'Private story leaked anonymously.');
   console.log('PASS: new stories are private and anonymous API reads are denied.');
   await setStoryVisibility(stories[0].id, true);
   const [publicStory]=await required(`/rest/v1/story_archives?id=eq.${stories[0].id}&select=*`);
   assert(publicStory.public_slug,'Publishing did not create a public slug.');
   const editionRows=await required(`/rest/v1/story_archives?id=in.(${created.storyIds.join(',')})&is_public=eq.true&select=id`,undefined,undefined,false);
   assert.deepEqual(editionRows.map(row=>row.id),[publicStory.id]);
   const publicRows=await required(`/rest/v1/story_archives?public_slug=eq.${encodeURIComponent(publicStory.public_slug)}&is_public=eq.true&select=id`,undefined,undefined,false);
   assert.equal(publicRows[0]?.id,publicStory.id);
   await setStoryVisibility(publicStory.id, false);
   assert.equal((await required(`/rest/v1/story_archives?id=eq.${publicStory.id}&select=id`,undefined,undefined,false)).length,0);
   await setStoryVisibility(publicStory.id, true);
   console.log('PASS: public slug/edition access, private exclusion, and share revocation.');
   if (!options.has('--skip-issues')) {
     const requestId=randomUUID();
     const payload={p_title:'Release check: saved family edition',p_story_ids:created.storyIds.slice().reverse(),p_description:JSON.stringify({type:'digitimes-edition',version:1,paper:'letter',showHistory:false,date:'2026-10-01'}),p_request_id:requestId};
     const issue=await createIssue({title:payload.p_title,description:payload.p_description,storyIds:payload.p_story_ids,userId:session.user.id,requestId});
     assert.equal(issue.id,requestId);created.issueIds.push(issue.id);
     const memberships=await required(`/rest/v1/issue_stories?issue_id=eq.${requestId}&select=story_id,position&order=position.asc`);
     assert.deepEqual(memberships.map(row=>row.story_id),payload.p_story_ids);
     const reopened=await fetchIssueById(requestId);
     assert.equal(reopened?.title,payload.p_title);
     assert.equal(reopened?.description,payload.p_description);
     assert.deepEqual(reopened.stories.map(row=>row.id),payload.p_story_ids);
     console.log('PASS: saved edition reopens with its title, ordered full stories and paper/date/history settings.');
     const again=await required('/rest/v1/rpc/create_issue_with_stories','POST',payload);
     assert.equal((Array.isArray(again)?again[0]:again).id,requestId);
     assert.equal((await required(`/rest/v1/issues?id=eq.${requestId}&select=id`)).length,1);
     const badId=randomUUID();
     assert(!(await api('/rest/v1/rpc/create_issue_with_stories','POST',{...payload,p_request_id:badId,p_story_ids:[randomUUID()]})).ok);
     assert.equal((await required(`/rest/v1/issues?id=eq.${badId}&select=id`)).length,0);
     assert(!(await api('/rest/v1/rpc/create_issue_with_stories','POST',{...payload,p_request_id:randomUUID()},false)).ok);
     console.log('PASS: atomic save, ordered membership, retry deduplication, rejected save without orphan, and anonymous save denial.');
   }
   const fixture={ownerId:session.user.id,created,publicId:publicStory.id,privateId:stories[1].id,publicSlug:publicStory.public_slug,photoUrl};
   if (options.has('--keep-fixture')) { fs.writeFileSync(fixtureFile,JSON.stringify(fixture,null,2));keep=true;console.log('Synthetic browser fixture prepared.'); }
 } finally { if (!keep) await cleanup(); }
})().catch(error=>{console.error(`Release smoke check failed: ${error.message}`);process.exitCode=1;});
