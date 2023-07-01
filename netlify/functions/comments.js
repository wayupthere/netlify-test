const fs = require('fs').promises
const Octokit = require('octokit').Octokit

const octokit = new Octokit({ auth: process.env.GITHUB_PAT_TOKEN })

exports.handler = async (event, context) => {
    try {
        if(event.httpMethod === 'GET'){
            const { comments } = await getCommentsFromGit()
            return {
                statusCode: 200,
                body: JSON.stringify({
                    comments:comments
                })
            };
        } else if(event.httpMethod === 'POST'){
            const data = JSON.parse(event.body)
            const errors = validateComment(data)
            if(errors.length){
                return {
                    statusCode: 400,
                    body: JSON.stringify(errors)
                };
            }

            await saveCommentsToGit(data)
            const { comments } = await getCommentsFromGit()
            return {
                statusCode: 200,
                body: JSON.stringify({
                    comments:comments
                })
            };
        } else {
            return {
                statusCode: 405,
                body: {
                    error:'Method not Allowed'
                },
            };
        }
    } catch(e){
        console.error(e)
        return {
            statusCode: 500,
            body: 'Unexpected Error',
        };
    }
};


async function getCommentsFromGit(){
    const result = await octokit.rest.repos.getContent({
       /* mediaType: {
            format: "raw",
        },*/
        owner: process.env.GITHUB_USER,
        repo: process.env.GITHUB_REPO,
        path: "comments.json",
    });
    const comments = Buffer.from(result.data.content, 'base64').toString()
    return {
        sha : result.data.sha,
        comments : JSON.parse(comments)
    }
}
async function getComments(){
    const data = await fs.readFile('./comments.json', 'utf-8');
    return JSON.parse(data)
}

async function saveComments(event){
    const { name, comment } = JSON.parse(event.body)
    const date = new Date().getTime()
    const data = await fs.readFile('./comments.json', 'utf-8');
    const allComments = JSON.parse(data)
    allComments.unshift({
        name:name,
        date:date,
        comment:comment
    })

    await fs.writeFile('./comments.json', JSON.stringify(allComments, null, 2));
}


function validateComment(data){
    const errors = []
    if(data.password !== process.env.PASSWORD){
        errors.push({
            field:'password',
            error:'Invalid Password'
        })
    }

    if(data.name.length > 256){
        errors.push({
            field:'name',
            error:'Name must be less than 256 characters'
        })
    }

    if(data.comment.length > 3000){
        errors.push({
            field:'comment',
            error:'Comment must be less than 3000 characters'
        })
    }

    return errors
}
async function saveCommentsToGit(data){
    const { name, comment } = data
    const date = new Date().getTime()
    const { sha, comments } = await getCommentsFromGit();
    const newComment = {
        name:name,
        date:date,
        comment:comment
    }

    comments.unshift(newComment)

    await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_USER,
        repo: process.env.GITHUB_REPO,
        path: "comments.json",
        message: "Add Comment",
        content: Buffer.from(JSON.stringify(comments, null, 2)).toString("base64"),
        branch: process.env.GITHUB_BRANCH,
        sha: sha
    });
}
