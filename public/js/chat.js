const socket = io()
//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationLinkTemplate = document.querySelector('#location-link-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix:true })

const autoScroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild
    //height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //visible height
    const visibleHeight = $messages.offsetHeight
    //height of messages container
    const containerHeight = $messages.scrollHeight
    //how far have i scrolled?
    const scrollOffset = $messages.scrollTop +visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('message', (message) => {


    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    
    autoScroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(locationLinkTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('H:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html)

    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        users,
        room
    })

    document.querySelector('#sidebar').innerHTML = html

})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    console.log('the send button has been clicked')

    const userInput = e.target.elements.message.value

    socket.emit('sendMessage', userInput, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error){
            console.log(error)
        }
        else {
            console.log('The message was delivered')
        }
    })
})

$locationButton.addEventListener('click', () => {

    $locationButton.setAttribute('disabled', 'disabled')

    if (!navigator.geolocation) {
        return alert ('Geolocation is not supported by your browser')
    }

    //navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', {
            lat: 0,
            long: 0
        }, () => {
            console.log('Location shared!')
            $locationButton.removeAttribute('disabled')
        })
    //})

})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})