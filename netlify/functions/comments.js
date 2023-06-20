const fs = require('fs').promises;

exports.handler = async (event, context) => {
    try {
        if(event.httpMethod === 'GET'){
            const comments = await getComments()
            return {
                statusCode: 200,
                body: JSON.stringify({
                    comments:comments
                })
            };
        } else if(event.httpMethod === 'POST'){
            await saveComments(event)
            const comments = await getComments()
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
