// Create application
var App = {};
App.Liam = function () {
    this.init();
}
// Initalise audio and listeners
App.Liam.prototype.init = function () {
    var self = this;
    // Load the audio files
    self.loadAudio();
    // Setup listener on click of picture
    $(document).on('click', '.advice', function () {
        self.speak();
        ga('send', 'event', 'advice', 'button', 'Get some advice');
        return false;
    });
    // Setup listeners for the audio buttons
    $(document).on('click', '.word', function () {
        self.playAudio(this.text);
        ga('send', 'event', 'advice', 'word', this.text);
        return false;
    });
    // Setup speach recognition
    self.initSpeachRecognition();
}
App.Liam.prototype.recognition = null;
App.Liam.prototype.transcript = null;
App.Liam.prototype.speachViews = {
    'speach':       $('.speach'), 
    'alert':        $('.speach .alert-box'),
    'callout':      $('.speach .panel.callout'),
    'loadingText':  $('.speach .panel.callout h3'),
    'meter':        $('.speach .panel.callout .meter'),
    'alertbox':     $('.speach .alert-box'),
    'button':       $('.button.question'),
}
App.Liam.prototype.initSpeachRecognition = function () {
    var self = this;
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.onresult = function (event) {
        self.speachResult(event);
    }
    this.recognition.onend = function (event) {
        self.speachOff();
        if (!self.transcript) {
            self.speachError({error: 'no-speech'})
        }
    }
    this.recognition.onstart = function (event) {
        self.transcript = null;
        self.speachOn();
    }
    this.recognition.onerror = function (event) {
        self.speachError(event);
    }
    $(document).on('click', '.button.question:not(.disabled)', function () {
        self.speachQuestion();
        self.recognition.start();
        ga('send', 'event', 'question', 'button', 'Ask a question');
    });
}
App.Liam.prototype.speachResult = function (event) {
    var self = this,
        results = event.results,
        result = null,
        answer = null,
        i = 0;
    for (i = event.resultIndex; i != results.length; ++i) {
        result = results[i];
        if (result.isFinal) {
            self.transcript = results[0][0].transcript;
            ga('send', 'event', 'question', 'question', self.transcript);
            this.speachViews.alert.attr('class', 'alert-box success');
            this.speachViews.alert.html('<strong>Your question:</strong> "' + results[0][0].transcript + '"');
            this.recognition.stop();
            this.speachViews.callout.attr('class', 'panel callout');
            this.speachViews.loadingText.html('<small>Loading engine...</small>');
            this.speachViews.meter.css('width', '5%');
            setTimeout(function () {
                self.speachViews.loadingText.html('<small>Processing voice...</small>');
                self.speachViews.meter.css('width', '25%');
                setTimeout(function () {
                    self.speachViews.loadingText.html('<small>Understanding tone...</small>');
                    self.speachViews.meter.css('width', '65%');
                    setTimeout(function () {
                        self.speachViews.loadingText.html('<small>Preparing response...</small>');
                        self.speachViews.meter.css('width', '85%');
                        setTimeout(function () {
                            answer = App.Liam.prototype.randomObjectFromList(self.answerListKeys);
                            answer.object.play();
                            self.speachViews.loadingText.html(answer.name);
                            self.speachViews.meter.css('width', '100%');
                            ga('send', 'event', 'question', 'answer', answer.name);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1000);
            return;
        }
    }
}
App.Liam.prototype.speachError = function (event) {
    this.speachViews.alertbox.attr('class', 'alert-box alert');
    this.speachViews.alertbox.text(this.errorsToHuman[event.error]);
    ga('send', 'event', 'question', 'error', event.error);
}
App.Liam.prototype.speachQuestion = function (event) {
    this.speachViews.speach.attr('class', 'speach');
    this.speachViews.callout.attr('class', 'panel callout hide');
    this.speachViews.alertbox.attr('class', 'alert-box warning');
    this.speachViews.alertbox.text('Allow access to your microphone at the top of the browser window');
    this.speachViews.button.attr('class', 'button question disabled');
}
App.Liam.prototype.speachOn = function () {
    this.speachViews.alertbox.attr('class', 'alert-box secondary');
    this.speachViews.alertbox.text('Please talk clearly into your microphone');
    this.speachViews.button.attr('class', 'button question disabled alert');
    ga('send', 'event', 'question', 'listening');
}
App.Liam.prototype.speachOff = function () {
    this.speachViews.button.attr('class', 'button question');
    ga('send', 'event', 'question', 'stopped');
}

// Loop through the files and load into objects
App.Liam.prototype.loadAudio = function () {
    var self = this,
        sound = null;
    $.each(['verbList', 'nounList', 'adverbList', 'answerList'], function (i, list) {
        $.each(self[list], function (name, file) {
            sound = new Audio(file);
            sound.load();
            self.audioObjects[name] = sound;
            self[list + 'Keys'].push(name);
            self.drawAudioToList(list, name)
        });
    });
}
// List all the words on the page
App.Liam.prototype.drawAudioToList = function (list, name) {
    $('#' + list.toLowerCase()).append('<li><a href="#" class="button word" style="display:block; width:100%;">' + name + '</a></li>');
}
// Play specific audio
App.Liam.prototype.playAudio = function (name) {
    if (name in this.audioObjects) {
        this.audioObjects[name].play();
    }
}
// Select a random object from array
App.Liam.prototype.randomObjectFromList = function (list) {
    // Find a random item in the passed list
    var name = list[Math.floor(Math.random() * list.length)];
    // Check to see if its loaded
    if (name in this.audioObjects) {
        return {name: name, object: this.audioObjects[name]};
    }
    // @todo stop this from looping forever
    this.randomObjectFromList(list);
}
// Play a random audio files
App.Liam.prototype.speak = function () {
    var self = this,
        verb = this.randomObjectFromList(this.verbListKeys),
        noun = this.randomObjectFromList(this.nounListKeys),
        adverb = this.randomObjectFromList(this.adverbListKeys);
    // Play in order using timeouts to give a near continous play
    verb.object.play();
    setTimeout(function () {
        noun.object.play();
        setTimeout(function () {
            adverb.object.play();
        }, self.getAudioDuration(noun.object));
    }, self.getAudioDuration(verb.object));
}
// Get the duration of the audio in milliseconds minus a few to give continous play
App.Liam.prototype.getAudioDuration = function (audio) {
    return ((audio.duration - 0.3) * 1000);
}
// Lists of audio files
App.Liam.prototype.verbListKeys = [];
App.Liam.prototype.verbList = {
    'Ask':      'audio/verbs/ask.mp3',
    'Try':      'audio/verbs/try.mp3',
    'Stop':     'audio/verbs/stop.mp3',
    'Start':    'audio/verbs/start.mp3',
    'Code':     'audio/verbs/code.mp3',
    'Reboot':   'audio/verbs/reboot.mp3',
    'Restart':  'audio/verbs/restart.mp3',
    'Destroy':  'audio/verbs/destroy.mp3',
    'Use':      'audio/verbs/use.mp3',
    'Innovate': 'audio/verbs/innovate.mp3',
    'Release':  'audio/verbs/release.mp3'
};
App.Liam.prototype.nounListKeys = [];
App.Liam.prototype.nounList = {
    'Rob':      'audio/nouns/rob.mp3',
    'Amit':     'audio/nouns/amit.mp3',
    'Server':   'audio/nouns/server.mp3',
    'Computer': 'audio/nouns/computer.mp3',
    'PHP':      'audio/nouns/php.mp3',
    'Python':   'audio/nouns/python.mp3',
    'Security': 'audio/nouns/security.mp3',
    'Pablo':    'audio/nouns/pablo.mp3',
    'Beard':    'audio/nouns/beard.mp3',
    'Essence':  'audio/nouns/essence.mp3',
    'Balls':    'audio/nouns/balls.mp3'
};
App.Liam.prototype.adverbListKeys = [];
App.Liam.prototype.adverbList = {
    'Always':   'audio/adverbs/always.mp3',
    'Before':   'audio/adverbs/before.mp3',
    'Coldly':   'audio/adverbs/coldly.mp3',
    'Daily':    'audio/adverbs/daily.mp3',
    'Fast':     'audio/adverbs/fast.mp3',
    'Loudly':   'audio/adverbs/loudly.mp3',
    'Now':      'audio/adverbs/now.mp3',
    'Often':    'audio/adverbs/often.mp3',
    'Quick':    'audio/adverbs/quick.mp3',
    'Soon':     'audio/adverbs/soon.mp3',
    'Wisely':   'audio/adverbs/wisely.mp3'
};
App.Liam.prototype.answerListKeys = [];
App.Liam.prototype.answerList = {
    'It is certain':            'audio/answers/it-is-certain.mp3',
    'It is decidedly so':       'audio/answers/it-is-decidedly-so.mp3',
    'Without a doubt':          'audio/answers/without-a-doubt.mp3',
    'Yes definitely':           'audio/answers/yes-definitely.mp3',
    'You may rely on it':       'audio/answers/you-may-rely-on-it.mp3',
    'As I see it, yes':         'audio/answers/as-i-see-it-yes.mp3',
    'Most likely':              'audio/answers/most-likely.mp3',
    'Outlook good':             'audio/answers/outlook-good.mp3',
    'Yes':                      'audio/answers/yes.mp3',
    'Signs point to yes':       'audio/answers/signs-point-to-yes.mp3',
    'Reply hazy try again':     'audio/answers/reply-hazy-try-again.mp3',
    'Ask again later':          'audio/answers/ask-again-later.mp3',
    'Better not tell you now':  'audio/answers/better-not-tell-you-now.mp3',
    'Cannot predict now':       'audio/answers/cannot-predict-now.mp3',
    'Concentrate and ask again':'audio/answers/concentrate-and-ask-again.mp3',
    'Don\'t count on it':       'audio/answers/dont-count-on-it.mp3',
    'My reply is no':           'audio/answers/my-reply-is-no.mp3',
    'My sources say no':        'audio/answers/my-sources-say-no.mp3',
    'Outlook not so good':      'audio/answers/outlook-not-so-good.mp3',
    'Very doubtful':            'audio/answers/very-doubtful.mp3'
};
// Error to human
App.Liam.prototype.errorsToHuman = {
    'no-speech':                'You didn\'t ask a question, how am I supposed to answer it?',
    'aborted':                  'Whoops you broke it, try again',
    'audio-capture':            'Whoops you broke it, try again',
    'network':                  'The internet has gone... again! Send an email to it-support@essencedigital.com',
    'not-allowed':              'I told you to allow the microphone, kill joy!',
    'service-not-allowed':      'I told you to allow the microphone, kill joy!',
    'bad-grammar':              'Whoops you broke it, try again',
    'language-not-supported':   'Whoops you broke it, try again'
}
// Array to hold objects
App.Liam.prototype.audioObjects = {};

// Load app once page is ready
$(function () {
    app = new App.Liam();
});
$(document).foundation();