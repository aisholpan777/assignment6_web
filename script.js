
$(function () {
    const original = [
        {
            id: 'balcony',
            name: 'Balcony',
            floor: 2,
            guests: [
                ['Aigerim', 'green', '20:45', 1, 'cup crumbs'],
                ['Aliya', 'black', '21:15', 0, 'phone cup'],
                ['Madina', 'green', '22:10', 0, 'phone bag crumbs'],
                ['Ivan', 'black', '20:10', 1, 'cup']
            ]
        },
        {
            id: 'hall',
            name: 'Hall',
            floor: 2,
            guests: [
                ['Arman', 'yellow', '20:35', 0, 'bag glasses'],
                ['Sophia', 'purple', '21:20', 1, 'phone'],
                ['Dias', 'green', '19:45', 1, ''],
                ['Bekzat', 'purple', '20:55', 0, 'bag cup crumbs'],
                ['Aruzhan', 'blue', '21:50', 1, 'phone'],
                ['Saule', 'green', '21:25', 0, 'glasses']
            ]
        },
        {
            id: 'kitchen',
            name: 'Kitchen',
            floor: 1,
            guests: [
                ['Nurlan', 'red', '19:40', 1, 'phone cup'],
                ['Emma', 'black', '20:15', 0, 'bag'],
                ['Timur', 'green', '21:05', 1, 'phone bag crumbs'],
                ['Sergey', 'yellow', '20:50', 0, ''],
                ['Yerlan', 'red', '21:40', 1, 'glasses phone'],
                ['Kamila', 'green', '20:05', 0, 'cup']
            ]
        },
        {
            id: 'living',
            name: 'Living room',
            floor: 1,
            guests: [
                ['Daniel', 'blue', '19:55', 1, 'glasses'],
                ['Zarina', 'green', '21:10', 0, 'bag phone crumbs'],
                ['Natasha', 'yellow', '20:30', 1, ''],
                ['Askar', 'black', '21:00', 1, 'phone'],
                ['Inkar', 'purple', '20:20', 0, 'bag']
            ]
        }
    ];

    const colors = {
        red: '#dc4754',
        blue: '#3974d8',
        green: '#278d64',
        black: '#29323b',
        yellow: '#e8a41d',
        purple: '#9453ce'
    };

    const icons = {
        phone: '📱',
        glasses: '👓',
        bag: '👜',
        cup: '☕',
        crumbs: '🍰'
    };

    const labels = {
        phone: 'a phone',
        glasses: 'glasses',
        bag: 'a bag',
        cup: 'a cup',
        crumbs: 'cake crumbs'
    };

    const questions = [
        'Who is in the hall?',
        'Who is dressed in yellow or purple?',
        'Which AITU students are upstairs?',
        'Who has glasses or a bag?',
        'Who came with nothing at all?',
        'Who has a phone but no bag?',
        'Who arrived between 20:30 and 21:00?',
        'Who arrived after 21:00 and is not an AITU student?',
        'Who stands right next to Askar?',
        'Who stands last in each room?',
        'Who stands third in each room?',
        'Who stands after Timur in his room?',
        'Who stands right before someone in black?',
        'In which room is Aruzhan?',
        'Which rooms have fewer than 6 guests?',
        'Which rooms have a cup but no glasses?',
        'Who came first to each room?',
        'Miras joins between Askar and Inkar',
        'Natasha goes home',
        'Who took the cake?'
    ];

    let rooms = [];
    let sortState = {};
    let modalGuest = null;
    let modalToken = 0;
    let partyVersion = 0;
    let moveBusy = false;
    let currentCase = null;

    function minutes(time) {
        const [hours, mins] = time.split(':').map(Number);
        return hours * 60 + mins;
    }

    function fresh() {
        return original.map(room => ({
            ...room,
            guests: room.guests.map((guest, index) => ({
                name: guest[0],
                color: guest[1],
                time: guest[2],
                student: Boolean(guest[3]),
                things: guest[4] ? guest[4].split(' ') : [],
                order: index
            }))
        }));
    }

    function findData(name) {
        for (const room of rooms) {
            const guest = room.guests.find(item => item.name === name);

            if (guest) {
                return { guest, room };
            }
        }

        return null;
    }

    function avatar(name) {
        return 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' +
            encodeURIComponent(name);
    }

    function makeCard(guest) {
        const $card = $('<article class="guest" tabindex="0">')
            .addClass('color-' + guest.color)
            .toggleClass('aitu', guest.student)
            .attr({
                'data-name': guest.name,
                'data-color': guest.color,
                'data-time': guest.time,
                'data-minutes': minutes(guest.time),
                'data-student': String(guest.student),
                'data-things': guest.things.join(' ')
            })
            .css('--ring', colors[guest.color]);

        $('<img class="avatar" alt="">')
            .attr('src', avatar(guest.name))
            .appendTo($card);

        if (guest.student) {
            $('<span class="student-badge">🎓</span>')
                .appendTo($card);
        }

        $('<div class="name">')
            .text(guest.name)
            .appendTo($card);

        $('<div class="time">')
            .text('◷ ' + guest.time)
            .appendTo($card);

        $('<div class="things">')
            .text(guest.things.map(thing => icons[thing]).join(' '))
            .appendTo($card);

        return $card;
    }

    function stopAnimations() {
        $('.guest, .placeholder, .flight, #detail')
            .stop(true, false);

        $('.flight, .placeholder').remove();

        $('.guest').css({
            left: '',
            top: '',
            opacity: '',
            width: '',
            height: ''
        });

        moveBusy = false;
    }

    function render() {
        partyVersion++;
        stopAnimations();

        rooms.forEach(room => {
            const $list = $('#' + room.id + ' .guests').empty();

            room.guests.forEach(guest => {
                $list.append(makeCard(guest));
            });
        });

        $('.sort').each(function () {
            const id = $(this).closest('.room').attr('id');

            $(this).text(
                sortState[id] ? 'Original order' : 'Sort by time'
            );
        });
    }

    function clearSpot() {
        currentCase = null;

        $('.guest')
            .stop(true, false)
            .animate({ opacity: 1, top: 0 }, 300)
            .removeClass('selected');

        $('.room').removeClass('selected');
    }

    function reset() {
        closeModal(true);
        partyVersion++;
        sortState = {};
        rooms = fresh();

        render();
        clearSpot();

        $('#result').text('Original party restored.');
    }

    function jump($guests) {
        $guests.each(function () {
            const $guest = $(this);

            $guest
                .css({ position: 'relative', top: 0 })
                .animate(
                    { top: -13 },
                    {
                        duration: 140,
                        queue: false,
                        complete: function () {
                            $(this).animate(
                                { top: 0 },
                                {
                                    duration: 180,
                                    queue: false
                                }
                            );
                        }
                    }
                );
        });
    }

    function caseQuery(number) {
        switch (number) {
            case 1:
                return $('#hall .guest');

            case 2:
                return $('.guest.color-yellow, .guest.color-purple');

            case 3:
                return $('.room[data-floor="2"] .guest.aitu');

            case 4:
                return $('.guest[data-things~="glasses"], .guest[data-things~="bag"]');

            case 5:
                return $('.guest[data-things=""]');

            case 6:
                return $('.guest[data-things~="phone"]')
                    .not('[data-things~="bag"]');

            case 7:
                return $('.guest').filter(function () {
                    const time = +$(this).attr('data-minutes');
                    return time >= 1230 && time <= 1260;
                });

            case 8:
                return $('.guest:not(.aitu)').filter(function () {
                    return +$(this).attr('data-minutes') > 1260;
                });

            case 9:
                return $('.guest[data-name="Askar"]')
                    .prev('.guest')
                    .add(
                        $('.guest[data-name="Askar"]').next('.guest')
                    );

            case 10:
                return $('.room .guests .guest:last-child');

            case 11:
                return $('.room .guests .guest:nth-child(3)');

            case 12:
                return $('.guest[data-name="Timur"]')
                    .nextAll('.guest');

            case 13:
                return $('.guest.color-black')
                    .prev('.guest');

            case 14:
                return $('.room:has(.guest[data-name="Aruzhan"])');

            case 15:
                return $('.room').filter(function () {
                    return $(this).find('.guest').length < 6;
                });

            case 16:
                return $('.room:has(.guest[data-things~="cup"])')
                    .not(':has(.guest[data-things~="glasses"])');

            case 17:
                return $('.room').map(function () {
                    return $(this)
                        .find('.guest')
                        .toArray()
                        .sort((a, b) => {
                            return +$(a).attr('data-minutes') -
                                   +$(b).attr('data-minutes');
                        })[0];
                });

            case 20:
                return $('.room[data-floor="1"] .guest[data-things~="crumbs"]')
                    .not('[data-things~="cup"]')
                    .filter(function () {
                        const time = +$(this).attr('data-minutes');

                        const nextToStudent =
                            $(this).prev('.aitu').length > 0 ||
                            $(this).next('.aitu').length > 0;

                        return time > 1260 &&
                               time < 1290 &&
                               nextToStudent;
                    });

            default:
                return $();
        }
    }

    function spotlight($found) {
        $('.guest')
            .stop(true, false)
            .animate({ opacity: 0.2, top: 0 }, 300)
            .removeClass('selected');

        const $bright = $found
            .filter('.guest')
            .add(
                $found.filter('.room').find('.guest')
            );

        $bright
            .stop(true, false)
            .animate({ opacity: 1 }, 300)
            .addClass('selected');

        jump($bright);
    }

    function showResult(number, $found) {
        const isRoom = $found.first().hasClass('room');

        const names = $found.map(function () {
            return isRoom
                ? $(this).attr('data-room')
                : $(this).attr('data-name');
        }).get();

        const message =
            'Case ' + number +
            ' — ' + names.length +
            ' found: ' +
            (names.join(', ') || 'none');

        $('#result').text(
            message + (number === 20 ? ' — Cake thief!' : '')
        );
    }

    function runCase(number) {
        if (moveBusy) return;

        closeModal(true);
        clearSpot();

        currentCase = number;

        if (number === 18 || number === 19) {
            rooms = fresh();
            sortState = {};
            render();

            const version = partyVersion;

            if (number === 18) {
                const room = rooms.find(item => item.id === 'living');

                const guest = {
                    name: 'Miras',
                    color: 'blue',
                    time: '21:20',
                    student: true,
                    things: ['phone'],
                    order: 3.5
                };

                const index = room.guests.findIndex(
                    item => item.name === 'Inkar'
                );

                room.guests.splice(index, 0, guest);

                const $card = makeCard(guest)
                    .hide()
                    .insertAfter(
                        $('.guest[data-name="Askar"]')
                    );

                $card.fadeIn(500, function () {
                    if (version !== partyVersion) return;

                    spotlight($card);

                    $('#result').text(
                        'Case 18: Miras joined between Askar and Inkar.'
                    );
                });
            } else {
                $('.guest[data-name="Natasha"]')
                    .fadeOut(500, function () {
                        if (version !== partyVersion) return;

                        $(this).remove();

                        const room = rooms.find(
                            item => item.id === 'living'
                        );

                        room.guests = room.guests.filter(
                            guest => guest.name !== 'Natasha'
                        );

                        $('#result').text(
                            'Case 19: Natasha went home.'
                        );
                    });
            }

            return;
        }

        render();

        const $found = caseQuery(number);

        spotlight($found);
        showResult(number, $found);
    }

    function closeModal(immediate = false) {
        modalToken++;

        const $overlay = $('#overlay');
        const $box = $('#detail');

        $box.stop(true, false);

        if (immediate) {
            modalGuest = null;
            $overlay.hide().removeClass('is-open');
            $overlay.attr('aria-hidden', 'true');
            $box.css({ opacity: 1 });
            return;
        }

        if (!modalGuest) {
            $overlay.hide().removeClass('is-open');
            $overlay.attr('aria-hidden', 'true');
            return;
        }

        modalGuest = null;

        const token = modalToken;

        $box.animate({ opacity: 0 }, 220, function () {
            if (token !== modalToken) return;

            $overlay.hide().removeClass('is-open');
            $overlay.attr('aria-hidden', 'true');
            $box.css({ opacity: 1 });
        });
    }

    function openModal(name) {
        const found = findData(name);

        if (!found || moveBusy) return;

        closeModal(true);

        const token = ++modalToken;
        modalGuest = name;

        const { guest, room } = found;
        const $box = $('#detail');
        const $overlay = $('#overlay');

        $('#detail-body').empty().append(
            $('<img alt="Guest avatar">')
                .attr('src', avatar(name))
                .css('--ring', colors[guest.color]),

            $('<h2>').text(name),

            $('<p>').text(
                'Room: ' + room.name + ' (floor ' + room.floor + ')'
            ),

            $('<p>').text('Clothing: ' + guest.color),

            $('<p>').text('Came at ' + guest.time),

            $('<p>').text(
                guest.student
                    ? 'AITU student'
                    : 'Not an AITU student'
            ),

            $('<p>').text(
                guest.things.length
                    ? 'Has ' + guest.things.map(
                        thing => labels[thing]
                    ).join(', ')
                    : 'Came with nothing'
            )
        );

        $('#moves').empty();

        rooms
            .filter(item => item.id !== room.id)
            .forEach(item => {
                $('<button type="button">')
                    .text('Move to ' + item.name)
                    .on('click', function () {
                        moveGuest(name, item.id);
                    })
                    .appendTo('#moves');
            });

        $box.stop(true, false).css({
            left: '',
            top: '',
            width: '',
            height: '',
            opacity: 0
        });

        $overlay.addClass('is-open').show();
        $overlay.attr('aria-hidden', 'false');

        $box.animate({ opacity: 1 }, 280, function () {
            if (token !== modalToken) return;
        });
    }

    function moveGuest(name, targetId) {
        if (moveBusy) return;

        const source = findData(name);

        const destinationRoom = rooms.find(
            room => room.id === targetId
        );

        if (!source || !destinationRoom) return;
        if (source.room === destinationRoom) return;

        moveBusy = true;
        closeModal(true);

        const $card = $('.guest[data-name="' + name + '"]');

        const old = $card.offset();
        const width = $card.outerWidth();
        const height = $card.outerHeight();

        const $ghost = $card
            .clone()
            .addClass('flight')
            .css({
                left: old.left,
                top: old.top,
                width,
                height,
                margin: 0,
                opacity: 1
            })
            .appendTo('body');

        const $oldPlace = $('<div class="placeholder">')
            .css({
                flex: '0 0 ' + width + 'px',
                width,
                height
            })
            .insertBefore($card);

        $card.remove();

        source.room.guests = source.room.guests.filter(
            guest => guest.name !== name
        );

        destinationRoom.guests.push(source.guest);

        sortState[source.room.id] = false;
        sortState[targetId] = false;

        const $newPlace = $('<div class="placeholder">')
            .css({
                flex: '0 0 0px',
                width: 0,
                height
            })
            .appendTo('#' + targetId + ' .guests');

        const destination = $newPlace.offset();

        $oldPlace.animate(
            { width: 0, opacity: 0 },
            {
                duration: 450,
                step: function (value, fx) {
                    if (fx.prop === 'width') {
                        $(this).css(
                            'flex-basis',
                            value + 'px'
                        );
                    }
                },
                complete: function () {
                    $oldPlace.remove();
                }
            }
        );

        $newPlace.animate(
            { width, opacity: 1 },
            {
                duration: 450,
                step: function (value, fx) {
                    if (fx.prop === 'width') {
                        $(this).css(
                            'flex-basis',
                            value + 'px'
                        );
                    }
                }
            }
        );

        const version = partyVersion;

        $ghost.animate(
            {
                left: destination.left,
                top: destination.top
            },
            520,
            function () {
                if (version !== partyVersion) return;

                $ghost.remove();

                $newPlace.replaceWith(
                    makeCard(source.guest)
                );

                moveBusy = false;

                $('#' + source.room.id + ' .sort').text('Sort by time');
                $('#' + targetId + ' .sort').text('Sort by time');

                $('#result').text(
                    name + ' moved to ' +
                    destinationRoom.name + '.'
                );
            }
        );
    }

    function sortRoom(id) {
        if (moveBusy) return;

        const room = rooms.find(item => item.id === id);

        if (!room) return;

        const $list = $('#' + id + ' .guests');
        const $cards = $list.children('.guest');
        const oldPositions = {};

        $cards.each(function () {
            const name = $(this).attr('data-name');
            const rect = this.getBoundingClientRect();

            oldPositions[name] = {
                left: rect.left,
                top: rect.top
            };
        });

        $cards.stop(true, false).css({
            left: 0,
            top: 0
        });

        sortState[id] = !sortState[id];

        room.guests.sort(
            sortState[id]
                ? (a, b) => minutes(a.time) - minutes(b.time)
                : (a, b) => a.order - b.order
        );

        const ordered = room.guests.map(guest => {
            return $cards.filter(function () {
                return $(this).attr('data-name') === guest.name;
            })[0];
        });

        $list.append(ordered);

        ordered.forEach(element => {
            if (!element) return;

            const $element = $(element);
            const name = $element.attr('data-name');
            const previous = oldPositions[name];
            const current = element.getBoundingClientRect();

            $element
                .css({
                    position: 'relative',
                    left: previous.left - current.left,
                    top: previous.top - current.top
                })
                .animate(
                    {
                        left: 0,
                        top: 0
                    },
                    {
                        duration: 450,
                        queue: false
                    }
                );
        });

        $('#' + id + ' .sort').text(
            sortState[id]
                ? 'Original order'
                : 'Sort by time'
        );

        $('#result').text(
            room.name +
            (sortState[id]
                ? ' sorted by arrival time.'
                : ' restored to picture order.')
        );
    }

    questions.forEach((question, index) => {
        $('#case').append(
            $('<option>')
                .val(index + 1)
                .text(
                    'Case ' + (index + 1) +
                    ': ' + question
                )
        );
    });

    $('#run').on('click', function () {
        const number = Number($('#case').val());
        runCase(number);
    });

    $('#clear').on('click', function () {
        clearSpot();
        $('#result').text('Spotlight cleared.');
    });

    $('#reset').on('click', reset);

    $(document)
        .on('click', '.guest', function () {
            openModal($(this).attr('data-name'));
        })
        .on('keydown', '.guest', function (event) {
            if (event.key === 'Enter') {
                openModal($(this).attr('data-name'));
            }
        })
        .on('click', '.sort', function () {
            const id = $(this)
                .closest('.room')
                .attr('id');

            sortRoom(id);
        })
        .on('keydown', function (event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });

    $('#close').on('click', function () {
        closeModal();
    });

    $('#overlay').on('click', function (event) {
        if (event.target === this) {
            closeModal();
        }
    });

    reset();
});
