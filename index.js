function getComments(){
    const commentsUrl = $('#commentForm').attr('action')
    $.get({
        url: commentsUrl,
        success:handleSuccessResponse,
        error:function(e){
            const x = arguments
            console.log(e)
            alert('error loading comments')
        },
    });
}

function renderComments(comments){
    // create variable to save all the html
    let commentHtml = ''
    comments.forEach((comment) => {
        // create commentBlock jquery object from HTML
        const $commentBlock = $(`
            <div class="comment-outer" id="comment-${comment.date}">
                <div class="comment-name"></div>
                <div class="comment-date">${comment.date}</div>
                <div class="comment-text"></div>
            </div>`)

        // add name and comment to the html
        // needs to be done using .text() to prevent against hacking
        $commentBlock.find('.comment-name').text(comment.name)
        $commentBlock.find('.comment-text').text(comment.comment)

        //convert the html element to a string and add the string to the commentHtml variable
        commentHtml += $commentBlock.get(0).outerHTML
    })

    // add all the html to the #commentList div
    $('#commentList').html(commentHtml)
}

function handleSuccessResponse(data){
    // handle success saving comment
    data = JSON.parse(data)

    // if there is no data.comments default to an empty array
    const comments = data.comments || []

    // render comments on page
    renderComments(comments)
}

$('#commentForm').on( "submit", function( event ) {
    // prevent default action
    event.preventDefault()
    // get elements as jquery objects
    const $form = $(this)
    const $nameField = $form.find('#name')
    const $commentField = $form.find('#comment')

    // get field values
    const name = $nameField.val().trim()
    const comment = $commentField.val().trim()

    // if name or comment is empty alert error
    if(!name || !comment) {
        alert('Name and Comment are required')
        return
    }

    if(!name.length > 256) {
        alert('Name is too long')
        return
    }

    if(!name.length > 2000) {
        alert('Comment is too long')
        return
    }

    // get url to submit form to
    const action = $form.attr('action')

    // create data to send
    const data = {
        name:name,
        comment:comment
    }

    // send data to server
    $.post({
        url: action,
        data: JSON.stringify(data),
        success: handleSuccessResponse,
        error:function(e){
            // handle errors saving comment
            const x = arguments
            console.log(e)
            alert('error')
        },
    });

    // reset form
    $nameField.val('')
    $commentField.val('')
});

// call the getComments function when the page loads
getComments()
