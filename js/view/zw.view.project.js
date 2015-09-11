'use strict';

(function ($, Backbone) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    var ReactTransitionGroup = React.addons.TransitionGroup;

    /* Control */
    var ZWPageGroup = React.createClass({
        displayName: 'ZWPageGroup',

        getInitialState: function getInitialState() {
            return { items: [] };
        },
        handleAdd: function handleAdd(item) {
            var newItems = this.state.items.concat(item);
            this.setState({ items: newItems });
        },
        handleRemove: function handleRemove(i) {
            var newItems = this.state.items;
            newItems.splice(i, 1);
            this.setState({ items: newItems });
        },
        handleUpdate: function handleUpdate(updateItem) {
            var newItems = this.state.items.map(function (item) {
                return item.key === updateItem.key ? updateItem : item;
            });
            this.setState({ items: newItems });
        },
        componentDidMount: function componentDidMount() {
            ZWPubSub.sub('ZWPageGroup:add', (function (item) {
                this.handleAdd(item);
            }).bind(this));
            ZWPubSub.sub('ZWPageGroup:remove', (function (i) {
                this.handleRemove(i);
            }).bind(this));
            ZWPubSub.sub('ZWPageGroup:update', (function (item) {
                this.handleUpdate(item);
            }).bind(this));
        },
        render: function render() {
            var items = this.state.items.map((function (item, i) {
                return React.createElement(ZWPage, { backLink: item.backLink, key: item.key, display: item.display, showHeader: item.showHeader, headerTitle: item.headerTitle, content: item.content, customClass: item.customClass, expandContent: item.expandContent });
            }).bind(this));
            return React.createElement(
                ReactTransitionGroup,
                { className: 'zw-page-transition', transitionName: 'fly-in' },
                React.createElement(
                    'div',
                    { className: 'zw-spin' },
                    React.createElement(SVGIconLoading, null)
                ),
                items
            );
        }
    });
    var ZWPage = React.createClass({
        displayName: 'ZWPage',

        loadingInterval: undefined,
        getInitialState: function getInitialState() {
            return { expandContent: false };
        },
        componentDidMount: function componentDidMount() {
            var node = $(React.findDOMNode(this));
            node.parent().addClass('zw-page-loading');
        },
        componentWillEnter: function componentWillEnter(callback) {
            setTimeout(function () {
                callback();
            }, 200);
        },
        componentDidEnter: function componentDidEnter() {
            var node = $(React.findDOMNode(this));
            node.addClass('fly-in-enter').parent().removeClass('zw-page-loading');

            //binding waves effect when click on link
            $('.zw-waves').on('click', function (e) {
                e.preventDefault();

                var $this = $(this);
                $this.addClass('zw-waves--clicked');
                setTimeout(function () {
                    $this.removeClass('zw-waves--clicked');
                    var href = $this.attr('href');
                    if (href !== '' && href !== '#') {
                        window.location = href;
                    }
                }, 200);
            });

            //listen for events
            ZWPubSub.sub('ZWTextEllipsis:toggle', (function (e) {
                this.setState({ expandContent: !this.state.expandContent });
            }).bind(this));
        },
        render: function render() {
            var header = this.props.showHeader ? React.createElement(
                'h2',
                { className: this.props.backLink === undefined ? 'zw-first-page-title' : '' },
                this.props.backLink === undefined ? null : React.createElement(
                    'a',
                    { href: this.props.backLink, title: '', className: 'zw-back' },
                    React.createElement(SVGIconBack, null)
                ),
                React.createElement(ZWTextEllipsis, { text: this.props.headerTitle === undefined ? '' : this.props.headerTitle })
            ) : null;
            var expandContent = this.state.expandContent ? this.props.expandContent : null;
            return React.createElement(
                'div',
                { key: this.props.key, className: 'zw-page' + (this.props.customClass === undefined ? '' : ' ' + this.props.customClass) },
                header,
                React.createElement(
                    'div',
                    { className: 'zw-page-content-dissolve' + (this.state.expandContent ? ' zw-page-content-dissolve--out' : '') },
                    expandContent
                ),
                React.createElement(
                    'div',
                    { className: 'zw-page-content-slide-fade' + (this.state.expandContent ? ' zw-page-content-slide-fade--down' : '') },
                    this.props.content
                )
            );
        }
    });
    /* end. Control */

    /* Page */
    var ZWMasterPage = React.createClass({
        displayName: 'ZWMasterPage',

        render: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(ZWNavBar, { active: this.props.active, uid: '1' }),
                React.createElement(ZWPageGroup, null),
                React.createElement(ZWNav, { active: this.props.active })
            );
        }
    });
    var ZWProjectDashboardPage = React.createClass({
        displayName: 'ZWProjectDashboardPage',

        init: false,
        dataInterval: undefined,
        loadDataFromServer: function loadDataFromServer() {
            $.ajax({
                url: this.props.data.url,
                dataType: 'json',
                cache: false,
                success: (function (response) {
                    var data = {
                        key: this.props.data.id,
                        showHeader: false,
                        headerTitle: '',
                        content: React.createElement(ZWProjectList, { data: response.projects }),
                        customClass: ''
                    };
                    if (!this.init) {
                        this.init = true;
                        ZWPubSub.pub('ZWPageGroup:add', data);
                    } else {
                        //update
                        ZWPubSub.pub('ZWPageGroup:update', data);
                    }
                }).bind(this),
                error: (function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            this.loadDataFromServer();
            if (this.props.data.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.data.pollInterval);
                ZWPubSub.sub('ZWPage:leave', (function () {
                    clearInterval(this.dataInterval);
                }).bind(this));
            }
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '0' });
        }
    });
    var ZWMilestonePage = React.createClass({
        displayName: 'ZWMilestonePage',

        init: false,
        dataInterval: undefined,
        loadDataFromServer: function loadDataFromServer() {
            $.ajax({
                url: this.props.data.url,
                dataType: 'json',
                cache: false,
                success: (function (response) {
                    var projectData = {
                        id: this.props.data.id,
                        from: this.props.data.from,
                        name: this.props.data.name,
                        pm: this.props.data.pm,
                        note: this.props.data.note
                    };
                    var data = {
                        backLink: this.props.backLink,
                        key: this.props.data.id,
                        showHeader: true,
                        headerTitle: this.props.data.name,
                        content: React.createElement(ZWList, { data: response.milestones }),
                        expandContent: React.createElement(ZWProjectInfo, { data: projectData }),
                        customClass: ''
                    };
                    if (!this.init) {
                        this.init = true;
                        ZWPubSub.pub('ZWPageGroup:add', data);
                    } else {
                        //update
                        ZWPubSub.pub('ZWPageGroup:update', data);
                    }
                }).bind(this),
                error: (function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            this.loadDataFromServer();
            if (this.props.data.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.data.pollInterval);
                ZWPubSub.sub('ZWPage:leave', (function () {
                    clearInterval(this.dataInterval);
                }).bind(this));
            }
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '0' });
        }
    });
    var ZWDeliverablePage = React.createClass({
        displayName: 'ZWDeliverablePage',

        init: false,
        dataInterval: undefined,
        loadDataFromServer: function loadDataFromServer() {
            $.ajax({
                url: this.props.data.url,
                dataType: 'json',
                cache: false,
                success: (function (response) {
                    var deliverableData = {
                        id: this.props.data.id,
                        dueDate: this.props.data.dueDate,
                        name: this.props.data.name,
                        effort: this.props.data.effort,
                        note: this.props.data.note
                    };
                    var data = {
                        backLink: this.props.backLink,
                        key: this.props.data.id,
                        showHeader: true,
                        headerTitle: this.props.data.name,
                        content: React.createElement(ZWTaskList, { data: response.tasks }),
                        expandContent: React.createElement(ZWDeliverableInfo, { data: deliverableData }),
                        customClass: ''
                    };
                    if (!this.init) {
                        this.init = true;
                        ZWPubSub.pub('ZWPageGroup:add', data);
                    } else {
                        //update
                        ZWPubSub.pub('ZWPageGroup:update', data);
                    }
                }).bind(this),
                error: (function (xhr, status, err) {
                    console.error(this.props.data.url, status, err.toString());
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            this.loadDataFromServer();
            if (this.props.data.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.data.pollInterval);
                ZWPubSub.sub('ZWPage:leave', (function () {
                    clearInterval(this.dataInterval);
                }).bind(this));
            }
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '0' });
        }
    });
    var ZWChatPage = React.createClass({
        displayName: 'ZWChatPage',

        init: false,
        dataInterval: undefined,
        loadDataFromServer: function loadDataFromServer() {
            $.ajax({
                url: this.props.data.url,
                dataType: 'json',
                cache: false,
                success: (function (response) {
                    var data = {
                        key: this.props.data.id,
                        showHeader: false,
                        content: React.createElement(ZWChat, { data: response })
                    };
                    if (!this.init) {
                        this.init = true;
                        ZWPubSub.pub('ZWPageGroup:add', data);
                    } else {
                        //update
                        ZWPubSub.pub('ZWPageGroup:update', data);
                    }
                }).bind(this),
                error: (function (xhr, status, err) {
                    console.error(this.props.data.url, status, err.toString());
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            this.loadDataFromServer();
            if (this.props.data.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.data.pollInterval);
                ZWPubSub.sub('ZWPage:leave', (function () {
                    clearInterval(this.dataInterval);
                }).bind(this));
            }
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '1' });
        }
    });
    /* end. Page */

    /* Block/Instance */
    var ZWChat = React.createClass({
        displayName: 'ZWChat',

        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-chat-app' },
                React.createElement(SVGIconMessage, null),
                React.createElement(
                    'p',
                    null,
                    ZWUtils.locale('Comming soon', 'us')
                )
            );
        }
    });

    var ZWTextEllipsis = React.createClass({
        displayName: 'ZWTextEllipsis',

        getInitialState: function getInitialState() {
            return { expand: false };
        },
        handleClick: function handleClick(e) {
            e.preventDefault();

            this.setState({ expand: !this.state.expand });
            ZWPubSub.pub('ZWTextEllipsis:toggle');
        },
        render: function render() {
            return React.createElement(
                'span',
                { className: 'zw-text-ellipsis' },
                React.createElement(
                    'em',
                    null,
                    this.props.text
                ),
                React.createElement('a', { href: '#', title: '', onClick: this.handleClick, className: this.state.expand ? 'active' : '' })
            );
        }
    });

    var ZWNav = React.createClass({
        displayName: 'ZWNav',

        getInitialState: function getInitialState() {
            return { active: '0' };
        },
        componentDidMount: function componentDidMount() {
            this.setState({ active: this.props.active });
        },
        render: function render() {
            return React.createElement(
                'ul',
                { className: 'zw-main-nav' },
                React.createElement(
                    'li',
                    { className: 'zw-main-nav__item' + (this.state.active === '0' ? ' zw-main-nav__item--active' : '') },
                    React.createElement(
                        'a',
                        { href: '#!/' + this.props.uid, title: 'Project' },
                        React.createElement(SVGIconProject, null)
                    )
                ),
                React.createElement(
                    'li',
                    { className: 'zw-main-nav__item' + (this.state.active === '1' ? ' zw-main-nav__item--active' : '') },
                    React.createElement(
                        'a',
                        { href: '#!chat/' + this.props.uid, title: 'Message' },
                        React.createElement(SVGIconMessage, null)
                    )
                )
            );
        }
    });

    var ZWNavBar = React.createClass({
        displayName: 'ZWNavBar',

        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-nav-bar' },
                React.createElement(
                    'h1',
                    null,
                    'zenwork'
                ),
                React.createElement(ZWSearchBar, null),
                React.createElement(
                    'a',
                    { className: 'zw-avatar-wrapper', href: '#!/1', title: '' },
                    React.createElement(SVGIconAvatar, { image: 'images/avatar.jpg' })
                )
            );
        }
    });

    var ZWSearchBar = React.createClass({
        displayName: 'ZWSearchBar',

        handleSubmit: function handleSubmit(e) {
            e.preventDefault();
        },
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-search-bar' },
                React.createElement(
                    'form',
                    { action: '', method: 'post', onSubmit: this.handleSubmit },
                    React.createElement(ZWFormRow, { fieldType: 'text', fieldName: 'zw-field-search', fieldId: 'zw-field-search', placeholder: 'Search' }),
                    React.createElement(
                        'div',
                        { className: 'zw-clear-field' },
                        React.createElement('button', { type: 'reset' }),
                        React.createElement(SVGIconRemove, null)
                    )
                )
            );
        }
    });

    var ZWProjectList = React.createClass({
        displayName: 'ZWProjectList',

        render: function render() {
            var projects = this.props.data.map(function (projectItem) {
                return React.createElement(
                    'li',
                    { key: projectItem.id },
                    React.createElement(
                        'a',
                        { href: '#!m/' + projectItem.id, title: projectItem.name, className: 'zw-waves' },
                        projectItem.name,
                        ' ',
                        React.createElement(SVGIconNext, null)
                    )
                );
            });
            return React.createElement(
                'ul',
                { id: 'zw-project-list', className: 'zw-project-list' },
                projects
            );
        }
    });

    var ZWProjectInfo = React.createClass({
        displayName: 'ZWProjectInfo',

        render: function render() {
            return React.createElement(
                'form',
                { action: '', method: 'post' },
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-project-name--' + this.props.data.id, labelName: 'Name', fieldType: 'textarea', fieldValue: this.props.data.name, fieldName: 'zw-field-project-name', fieldId: 'zw-field-project-name--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-project-from--' + this.props.data.id, labelName: 'From', fieldType: 'text', fieldValue: ZWUtils.formatDateFull(this.props.data.from), fieldName: 'zw-field-project-from', fieldId: 'zw-field-project-from--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-project-pm--' + this.props.data.id, labelName: 'PM', fieldType: 'text', fieldValue: this.props.data.pm, fieldName: 'zw-field-project-pm', fieldId: 'zw-field-project-pm--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-project-note--' + this.props.data.id, labelName: 'Note', fieldType: 'textarea', fieldValue: this.props.data.note, fieldName: 'zw-field-project-note', fieldId: 'zw-field-project-note--' + this.props.data.id, placeholder: this.props.data.note === '' ? ZWUtils.locale('Insert note', 'en') : this.props.data.note })
            );
        }
    });

    var ZWList = React.createClass({
        displayName: 'ZWList',

        render: function render() {
            var milestones = this.props.data.map(function (milestoneItem) {
                return React.createElement(
                    'li',
                    { key: milestoneItem.id },
                    React.createElement(ZWMilestone, { data: milestoneItem })
                );
            });
            return React.createElement(
                'ul',
                { id: 'zw-list', className: 'zw-list' },
                milestones
            );
        }
    });

    var ZWMilestone = React.createClass({
        displayName: 'ZWMilestone',

        getInitialState: function getInitialState() {
            return { expand: false };
        },
        handleClick: function handleClick(e) {
            e.preventDefault();

            this.setState({ expand: !this.state.expand });
        },
        render: function render() {
            var deliverables = this.props.data.deliverables.map(function (deliverableItem) {
                return React.createElement(
                    'li',
                    { key: deliverableItem.id },
                    React.createElement(ZWDeliverable, { data: deliverableItem })
                );
            });
            return React.createElement(
                'div',
                { className: 'zw-milestone' },
                React.createElement(
                    'span',
                    { className: 'zw-timeline-date' },
                    ZWUtils.formatDate(this.props.data.dueDate)
                ),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { className: 'zw-item-name zw-waves', onClick: this.handleClick, href: '', title: this.props.data.name },
                    this.props.data.name
                ),
                React.createElement(
                    'ul',
                    { className: 'zw-deliverable' + (this.state.expand ? '' : ' hidden') },
                    deliverables
                )
            );
        }
    });

    var ZWDeliverable = React.createClass({
        displayName: 'ZWDeliverable',

        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-deliverable' },
                React.createElement(
                    'span',
                    { className: 'zw-timeline-date' },
                    ZWUtils.formatDate(this.props.data.dueDate)
                ),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { className: 'zw-item-name zw-waves', href: '#!d/' + this.props.data.id, title: this.props.data.name },
                    this.props.data.name
                )
            );
        }
    });

    var ZWDeliverableInfo = React.createClass({
        displayName: 'ZWDeliverableInfo',

        render: function render() {
            return React.createElement(
                'form',
                { action: '', method: 'post' },
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-deliverable-name--' + this.props.data.id, labelName: 'Name', fieldType: 'textarea', fieldValue: this.props.data.name, fieldName: 'zw-field-deliverable-name', fieldId: 'zw-field-deliverable-name--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-deliverable-due--' + this.props.data.id, labelName: 'Due date', fieldType: 'text', fieldValue: ZWUtils.formatDateFull(this.props.data.dueDate), fieldName: 'zw-field-deliverable-due', fieldId: 'zw-field-deliverable-due--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-deliverable-effort--' + this.props.data.effort, labelName: 'Effort', fieldType: 'text', fieldValue: this.props.data.effort, fieldName: 'zw-field-deliverable-effort', fieldId: 'zw-field-deliverable-effort--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-deliverable-note--' + this.props.data.id, labelName: 'Note', fieldType: 'textarea', fieldValue: this.props.data.note, fieldName: 'zw-field-deliverable-note', fieldId: 'zw-field-deliverable-note--' + this.props.data.id, placeholder: this.props.data.note === '' ? ZWUtils.locale('Insert note', 'en') : this.props.data.note })
            );
        }
    });

    var ZWTaskList = React.createClass({
        displayName: 'ZWTaskList',

        render: function render() {
            var tasks = this.props.data.map(function (taskItem) {
                return React.createElement(
                    'li',
                    { key: taskItem.id },
                    React.createElement(ZWTask, { data: taskItem })
                );
            });

            return React.createElement(
                'ul',
                { className: 'zw-list zw-tasks-list' },
                tasks
            );
        }
    });

    var ZWTask = React.createClass({
        displayName: 'ZWTask',

        getInitialState: function getInitialState() {
            return { expand: false };
        },
        viewTaskDetails: function viewTaskDetails(e) {
            e.preventDefault();

            this.setState({ expand: !this.state.expand });
        },
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-task' },
                React.createElement(
                    'span',
                    { className: 'zw-timeline-date' },
                    ZWUtils.formatDate(this.props.data.dueDate)
                ),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { onClick: this.viewTaskDetails, className: 'zw-item-name zw-waves', href: '', title: this.props.data.name },
                    this.props.data.name
                ),
                React.createElement(
                    'div',
                    { className: 'zw-task__details' + (this.state.expand ? '' : ' hidden') },
                    this.state.expand ? React.createElement(
                        'form',
                        { action: this.props.data.id, method: 'post' },
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-from--' + this.props.data.id, labelName: 'From', fieldType: 'text', fieldValue: ZWUtils.formatDateFull(this.props.data.from), fieldName: 'zw-field-task-from', fieldId: 'zw-field-task-from--' + this.props.data.id }),
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-due--' + this.props.data.id, labelName: 'Due date', fieldType: 'text', fieldValue: ZWUtils.formatDateFull(this.props.data.dueDate), fieldName: 'zw-field-task-due', fieldId: 'zw-field-task-due--' + this.props.data.id }),
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-effort--' + this.props.data.id, labelName: 'Effort', fieldType: 'text', fieldValue: this.props.data.effort, fieldName: 'zw-field-task-effort', fieldId: 'zw-field-task-effort--' + this.props.data.id }),
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-assign--' + this.props.data.id, labelName: 'Assign', fieldType: 'text', fieldValue: this.props.data.assign, fieldName: 'zw-field-task-assign', fieldId: 'zw-field-task-assign--' + this.props.data.id, placeholder: this.props.data.assign === '' ? ZWUtils.locale('Assign to', 'en') : this.props.data.assign }),
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-note--' + this.props.data.id, labelName: 'Note', fieldType: 'textarea', fieldValue: this.props.data.note, fieldName: 'zw-field-task-note', fieldId: 'zw-field-task-note--' + this.props.data.id, placeholder: this.props.data.note === '' ? ZWUtils.locale('Insert note', 'en') : this.props.data.note })
                    ) : null
                )
            );
        }
    });

    var ZWField = React.createClass({
        displayName: 'ZWField',

        getInitialState: function getInitialState() {
            return { value: this.props.defaultValue };
        },
        updateField: function updateField(e) {
            this.setState({ value: e.target.value });
        },
        render: function render() {
            var field = null;
            switch (this.props.type) {
                case 'text':
                    field = React.createElement('input', { type: 'text', placeholder: this.props.placeholder, value: this.state.value, name: this.props.name, id: this.props.id, onChange: this.updateField });
                    break;
                case 'password':
                    field = React.createElement('input', { type: 'password', placeholder: this.props.placeholder, name: this.props.name, value: this.state.value, id: this.props.id, onChange: this.updateField });
                    break;
                case 'textarea':
                    field = React.createElement(
                        'div',
                        { placeholder: this.props.placeholder, className: 'zw-textarea', contentEditable: 'true', id: this.props.id, onChange: this.updateField },
                        this.state.value
                    );
                    break;
            }
            return React.createElement(
                'div',
                { className: 'zw-field' },
                field
            );
        }
    });

    var ZWFormRow = React.createClass({
        displayName: 'ZWFormRow',

        handleFocus: function handleFocus(e) {
            e.preventDefault();

            $('#' + $(e.target).attr('for')).focus();
        },
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-form-row' },
                this.props.labelTarget === undefined ? null : React.createElement(
                    'label',
                    { onClick: this.handleFocus, htmlFor: this.props.labelTarget },
                    this.props.labelName
                ),
                React.createElement(ZWField, { type: this.props.fieldType, defaultValue: this.props.fieldValue, name: this.props.fieldName, id: this.props.fieldId, placeholder: this.props.placeholder })
            );
        }
    });

    var ZWCheckbox = React.createClass({
        displayName: 'ZWCheckbox',

        /** status
         *  - 0: not start
         *  - 1: on going
         *  - 2: done
         */
        getInitialState: function getInitialState() {
            return {
                status: 0
            };
        },
        componentDidMount: function componentDidMount() {
            this.setState({ status: this.props.data });
        },
        getSVGIcon: function getSVGIcon() {
            switch (this.state.status) {
                case 0:
                    return React.createElement(SVGIconItemNormal, null);
                    break;
                case 1:
                    return React.createElement(SVGIconOnProgress, null);
                    break;
                case 2:
                    return React.createElement(SVGIconDone, null);
                    break;
            }
        },
        updateStatus: function updateStatus(e) {
            e.preventDefault();

            var nextStatus = this.state.status == 0 ? 1 : this.state.status == 1 ? 2 : 0;
            this.setState({ status: nextStatus });
        },
        render: function render() {
            return React.createElement(
                'a',
                { href: '#', title: '', onClick: this.updateStatus, className: 'zw-item-status zw-item-status--' + this.state.status },
                this.getSVGIcon()
            );
        }
    });
    /* end. Block/Instance */

    //entry
    var zwAppDom = document.getElementById('zw-app');
    //Project dashboard view
    ZWPubSub.sub('ZWApp.Project:dashboard', function (data) {
        React.render(React.createElement(ZWProjectDashboardPage, { data: data }), zwAppDom);
    });

    //Milestone view
    ZWPubSub.sub('ZWApp.Project:milestone', function (data) {
        React.render(React.createElement(ZWMilestonePage, { backLink: '#!/' + data.id, data: data }), zwAppDom);
    });

    //Deliverable view
    ZWPubSub.sub('ZWApp.Project:deliverable', function (data) {
        React.render(React.createElement(ZWDeliverablePage, { backLink: '#!m/' + data.pid, data: data }), zwAppDom);
    });

    //Chat view
    ZWPubSub.sub('ZWApp.Chat:app', function (data) {
        React.render(React.createElement(ZWChatPage, { data: data }), zwAppDom);
    });
})(jQuery, Backbone);