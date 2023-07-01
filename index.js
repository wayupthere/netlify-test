function getComments(){
    const commentsUrl = $('#commentForm').attr('action')
    $.get({
        url: commentsUrl,
        success:handleSuccessResponse,
        error:function(e){
            console.log(e)
            alert('error loading comments')
        },
    });
}

function renderComments(comments){
    // create variable to save all the html
    let commentHtml = ''

    // loop over the array of comments
    comments.forEach((commentObj) => {
        // create commentBlock jquery object from HTML
        const $commentBlock = $(`
            <div class="comment-outer" id="comment-${commentObj.date}">
                <div class="comment-name"></div>
                <div class="comment-date">${commentObj.date}</div>
                <div class="comment-text"></div>
            </div>`)

        // add name and comment to the html
        // needs to be done using .text() to prevent against hacking
        $commentBlock.find('.comment-name').text(commentObj.name)
        $commentBlock.find('.comment-text').text(commentObj.comment)

        //convert the html element to a string and add the string to the commentHtml variable
        commentHtml += $commentBlock.get(0).outerHTML
    })

    // add all the html to the #commentList div
    $('#commentList').html(commentHtml)
}

function resetForm(){
    $('#name, #comment').val('')
}

function handleSuccessResponse(data){
    // data comes back as a string we need to convert it to json
    data = JSON.parse(data)

    // get the comments from the data. If there is no data comments default to an empty array
    const comments = data.comments || []

    // render comments on page
    renderComments(comments)

    resetForm()
}


function submitForm(token){
    // get elements as jquery objects
    const $form = $('#commentForm')
    const $nameField = $form.find('#name')
    const $commentField = $form.find('#comment')

    // get field values
    const name = $nameField.val().trim()
    const comment = $commentField.val().trim()

    // if name or comment is empty alert error
    if(!name || !comment) {
        alert('Name, and Comment are required')
        return
    }

    if(!name.length > 256) {
        alert('Name is too long')
        return
    }

    if(!name.length > 5000) {
        alert('Comment is too long')
        return
    }

    // get url to submit form to
    const action = $form.attr('action')

    // create data to send
    const data = {
        name:name,
        comment:comment,
        'g-recaptcha-response':token
    }

    // send data to server
    $.post({
        url: action,
        data: JSON.stringify(data),
        success: handleSuccessResponse,
        error:function(xhr, status, statusText){
            if(xhr.status >=500){
                alert('Server Error')
            } else {
                // handle user errors here
                const errors = JSON.parse(xhr.responseText)
                alert(errors[0].error)
            }
        },
    });
}

// call the getComments function when the page loads
getComments()
