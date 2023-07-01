const Octokit = require('octokit').Octokit
const axios = require('axios')

const octokit = new Octokit({ auth: process.env.GITHUB_PAT_TOKEN })

exports.handler = async (event, context) => {
    try {
        if(event.httpMethod === 'GET'){
            const { comments } = await getCommentsFromGit()
            return createResponse(200, {comments:comments})
        } else if(event.httpMethod === 'POST'){
            //convert JSON string to object
            const data = JSON.parse(event.body)

            //check if is human
            const isHuman = await validateCaptcha(data['g-recaptcha-response'])
            if(!isHuman){
                return createResponse(400, {error:'Captcha Failed'})
            }

            //validate form data
            const errors = validateComment(data)
            if(errors.length){
                return createResponse(400, errors)
            }

            await saveCommentsToGit(data)

            const { comments } = await getCommentsFromGit()

            return createResponse(200, {comments:comments})
        } else {
            return createResponse(405, {error:'Method not Allowed'})
        }
    } catch(e){
        console.error(e.stack)
        return createResponse(500, {error:'Unexpected Error'})
    }
};

function createResponse(code, body){
    return {
        statusCode: code,
        body: JSON.stringify(body)
    }
}

async function getCommentsFromGit(){
    const result = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_USER,
        repo: process.env.GITHUB_REPO,
        path: process.env.FILE_NAME,
    });
    const comments = Buffer.from(result.data.content, 'base64').toString()
    return {
        sha : result.data.sha,
        comments : JSON.parse(comments)
    }
}

function validateComment(data){
    const errors = []

   /* if(data.password !== process.env.PASSWORD){
        errors.push({
            field:'password',
            error:'Invalid Password'
        })
    }*/

    if(data.name.length > 256){
        errors.push({
            field:'name',
            error:'Name must be less than 256 characters'
        })
    }

    if(data.comment.length > 5000){
        errors.push({
            field:'comment',
            error:'Comment must be less than 5000 characters'
        })
    }

    return errors
}

async function validateCaptcha(token){
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SITE_RECAPTCHA_SECRET}&response=${token}`
    const response = await axios.post(url)
    return response?.data?.success || false
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
        path: process.env.FILE_NAME,
        message: "Add Comment",
        content: Buffer.from(JSON.stringify(comments, null, 2)).toString("base64"),
        branch: process.env.GITHUB_BRANCH,
        sha: sha
    });
}
