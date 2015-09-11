'use strict';

(function($, Backbone) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    var ReactTransitionGroup = React.addons.TransitionGroup;

    /* Control */
        var ZWPageGroup = React.createClass({
            getInitialState: function() {
                return { items: [] };
            },
            handleLoading: function() {
                var node = $( React.findDOMNode(this) );
                setTimeout(function() {
                    node.addClass('zw-page-loading');
                }, 1);
            },
            handleLoaded: function() {
                var node = $( React.findDOMNode(this) );
                node.removeClass('zw-page-loading')
            },
            handleAdd: function(item) {
                var newItems = this.state.items.concat( item );
                this.setState( {items: newItems} );
            },
            handleRemove: function(i) {
                var newItems = this.state.items;
                newItems.splice(i, 1);
                this.setState( {items: newItems} );
            },
            handleUpdate: function(updateItem) {
                var newItems = this.state.items.map(function(item) {
                    return item.key === updateItem.key ? updateItem : item;
                });
                this.setState( {items: newItems} );
            },
            componentDidMount: function() {
                ZWPubSub.sub( 'ZWPageGroup:pageLoading', function() {
                    this.handleLoading();
                }.bind(this) );
                ZWPubSub.sub( 'ZWPageGroup:pageLoaded', function() {
                    this.handleLoaded();
                }.bind(this) );
                ZWPubSub.sub( 'ZWPageGroup:add', function(item) {
                    this.handleAdd( item );
                }.bind(this) );
                ZWPubSub.sub( 'ZWPageGroup:remove', function(i) {
                    this.handleRemove( i );
                }.bind(this) );
                ZWPubSub.sub( 'ZWPageGroup:update', function(item) {
                    this.handleUpdate( item );
                }.bind(this) );
            },
            render: function() {
                var items = this.state.items.map(function(item, i) {
                    return (
                        <ZWPage backLink={ item.backLink } key={ item.key } display={ item.display } showHeader={ item.showHeader } headerTitle={ item.headerTitle } content={ item.content } customClass={ item.customClass } expandContent={ item.expandContent } />
                    );
                }.bind(this));
                return (
                    <ReactTransitionGroup className="zw-page-transition" transitionName="fly-in">
                        <div className="zw-spin"><SVGIconLoading /></div>
                        { items }
                    </ReactTransitionGroup>
                );
            }
        });
        var ZWPage = React.createClass({
            loadingInterval: undefined,
            getInitialState: function() {
                return { expandContent: false };
            },
            componentWillEnter: function(callback) {
                setTimeout(function() {
                    ZWPubSub.pub( 'ZWPageGroup:pageLoaded' );
                    callback();
                }, 200);
            },
            componentDidEnter: function() {
                var node = $( React.findDOMNode(this) );
                node.addClass('fly-in-enter');

                //binding waves effect when click on link
                    node.find('.zw-waves').on('click', function(e) {
                        e.preventDefault();

                        var $this = $(this);
                        $this.addClass('zw-waves--clicked');
                        setTimeout(function() {
                            $this.removeClass('zw-waves--clicked');
                            var href = $this.attr('href');
                            if ( href !== '' && href !== '#' ) {
                                window.location = href;
                            }
                        }, 200);
                    });

                //listen for events
                    ZWPubSub.sub( 'ZWTextEllipsis:toggle', function(e) {
                        this.setState( { expandContent: !this.state.expandContent } );
                    }.bind(this) );
            },
            render: function() {
                var header = this.props.showHeader
                    ? <h2 className={ this.props.backLink === undefined ? 'zw-first-page-title' : '' }>{ this.props.backLink === undefined ? null : <a href={ this.props.backLink } title="" className="zw-back"><SVGIconBack /></a> }<ZWTextEllipsis text={ this.props.headerTitle === undefined ? '' : this.props.headerTitle } /></h2>
                    : null;
                var expandContent = this.state.expandContent
                    ? this.props.expandContent
                    : null;
                return (
                    <div key={ this.props.key } className={ 'zw-page' + ( this.props.customClass === undefined ? '' : (' ' + this.props.customClass) ) }>
                        { header }

                        <div className={ 'zw-page-content-dissolve' + (this.state.expandContent ? ' zw-page-content-dissolve--out' : '') }>
                            { expandContent }
                        </div>

                        <div className={ 'zw-page-content-slide-fade' + (this.state.expandContent ? ' zw-page-content-slide-fade--down' : '') }>
                            { this.props.content }
                        </div>
                    </div>
                );
            }
        });
    /* end. Control */

    /* Page */
        var ZWMasterPage = React.createClass({
            init: false,
            dataInterval: undefined,
            request: undefined,
            loadDataFromServer: function() {
                this.request = $.ajax({
                    url: this.props.data.url,
                    dataType: 'json',
                    cache: false,
                    success: function(response) {
                        var data = this.props.dataProcess.call( null, response );
                        if ( !this.init ) {
                            this.init = true;
                            ZWPubSub.pub( 'ZWPageGroup:add', data );
                        }
                        else { //update
                            ZWPubSub.pub( 'ZWPageGroup:update', data );
                        }
                    }.bind(this),
                    error: function(xhr, status, err) {
                        ZWThrow( xhr, status, err );
                    }.bind(this)
                });
            },
            componentDidMount: function() { //default call when rendered
                ZWPubSub.pub( 'ZWPageGroup:pageLoading' );
                this.loadDataFromServer();
                ZWPubSub.sub( 'ZWPage:leave', function() {
                    if ( this.request !== undefined ) {
                        this.request.abort();
                    }

                    if ( this.dataInterval !== undefined ) {
                        clearInterval( this.dataInterval );
                    }
                }.bind(this) );
                if ( this.props.data.pollInterval > 0 ) {
                    this.dataInterval = setInterval(this.loadDataFromServer, this.props.data.pollInterval);
                }
            },
            render: function() {
                return (
                    <div>
                        <ZWTopBar />
                        <ZWPageGroup />
                        <ZWNavBar active={ this.props.active } />
                    </div>
                );
            }
        });
        var ZWProjectDashboardPage = React.createClass({
            dataProcess: function(response) {
                return {
                    key: this.props.data.id,
                    showHeader: false,
                    headerTitle: '',
                    content: <ZWProjectList data={ response.projects } />,
                    customClass: ''
                };
            },
            render: function() {
                return (
                    <ZWMasterPage active="0" data={ this.props.data } dataProcess={ this.dataProcess } />
                );
            }
        });
        var ZWMilestonePage = React.createClass({
            dataProcess: function(response) {
                var projectData = {
                    id: this.props.data.id,
                    from: this.props.data.from,
                    name: this.props.data.name,
                    pm: this.props.data.pm,
                    note: this.props.data.note
                };
                return {
                    backLink: this.props.backLink,
                    key: this.props.data.id,
                    showHeader: true,
                    headerTitle: this.props.data.name,
                    content: <ZWList data={ response.milestones } />,
                    expandContent: <ZWProjectInfo data={ projectData } />,
                    customClass: ''
                };
            },
            render: function() {
                return (
                    <ZWMasterPage active="0" data={ this.props.data } dataProcess={ this.dataProcess } />
                );
            }
        });
        var ZWDeliverablePage = React.createClass({
            dataProcess: function(response) {
                var deliverableData = {
                    id: this.props.data.id,
                    dueDate: this.props.data.dueDate,
                    name: this.props.data.name,
                    effort: this.props.data.effort,
                    note: this.props.data.note
                };
                return {
                    backLink: this.props.backLink,
                    key: this.props.data.id,
                    showHeader: true,
                    headerTitle: this.props.data.name,
                    content: <ZWTaskList data={ response.tasks } />,
                    expandContent: <ZWDeliverableInfo data={ deliverableData } />,
                    customClass: ''
                };
            },
            render: function() {
                return (
                    <ZWMasterPage active="0" data={ this.props.data } dataProcess={ this.dataProcess } />
                );
            }
        });
        var ZWMessagePage = React.createClass({
            dataProcess: function(response) {
                return {
                    key: this.props.data.id,
                    showHeader: false,
                    content: <ZWMessage data={ response } />
                };
            },
            render: function() {
                return (
                    <ZWMasterPage active="1" data={ this.props.data } dataProcess={ this.dataProcess } />
                );
            }
        });
        var ZWPeoplePage = React.createClass({
            dataProcess: function(response) {
                return {
                    key: this.props.data.id,
                    showHeader: false,
                    content: <ZWPeople data={ response } />
                };
            },
            render: function() {
                return (
                    <ZWMasterPage active="2" data={ this.props.data } dataProcess={ this.dataProcess } />
                );
            }
        });
    /* end. Page */

    /* Block/Instance */
        var ZWMessage = React.createClass({
            render: function() {
                return (
                    <div className="zw-message-app">
                        <SVGIconMessage />
                        <p>{ ZWUtils.locale( 'Comming soon', 'us' ) }</p>
                    </div>
                );
            }
        });

        var ZWPeople = React.createClass({
            render: function() {
                return (
                    <div className="zw-people-app">
                        <SVGIconPeople />
                        <p>{ ZWUtils.locale( 'Comming soon', 'us' ) }</p>
                    </div>
                );
            }
        });

        var ZWTextEllipsis = React.createClass({
            getInitialState: function() {
                return { expand: false };
            },
            handleClick: function(e) {
                e.preventDefault();

                this.setState( { expand: !this.state.expand } );
                ZWPubSub.pub( 'ZWTextEllipsis:toggle' );
            },
            render: function() {
                return (
                    <span className="zw-text-ellipsis">
                        <em>{ this.props.text }</em>
                        <a href="#" title="" onClick={ this.handleClick } className={ this.state.expand ? 'active' : '' }></a>
                    </span>
                );
            }
        });

        var ZWTimelineDate = React.createClass({
            render: function() {
                var date = this.props.date.split('-');
                return (
                    <span className="zw-timeline-date">
                        <strong>{ date[0] }</strong>
                        <br />
                        { date[1] }
                    </span>
                );
            }
        });

        var ZWNavBar = React.createClass({
            handleClick: function(e) {
                e.preventDefault();
            },
            render: function() {
                return (
                    <div className="zw-nav-bar">
                        <ZWNav active={ this.props.active } />
                        <a href="" title="" onClick={ this.handleClick } className="zw-add-btn"><SVGIconAdd /></a>
                    </div>
                );
            }
        });

        var ZWNav = React.createClass({
            getInitialState: function() {
                return ( { active: '0' } );
            },
            componentDidMount: function() {
                this.setState( { active: this.props.active } );
            },
            render: function() {
                return (
                    <ul className="zw-main-nav">
                        <li className={ 'zw-main-nav__item' + ( this.state.active === '0' ? ' zw-main-nav__item--active' : '' ) }><a href="#!" title="Project"><SVGIconProject /></a></li>
                        <li className={ 'zw-main-nav__item' + ( this.state.active === '1' ? ' zw-main-nav__item--active' : '' ) }><a href="#!mc" title="Message"><SVGIconMessage /></a></li>
                        <li className={ 'zw-main-nav__item' + ( this.state.active === '2' ? ' zw-main-nav__item--active' : '' ) }><a href="#!p" title="People"><SVGIconPeople /></a></li>
                    </ul>
                );
            }
        });

        var ZWTopBar = React.createClass({
            render: function() {
                return (
                    <div className="zw-top-bar">
                        <h1>zenwork</h1>
                        <ZWSearchBar />
                        <a className="zw-avatar-wrapper" href="#!" title=""><SVGIconAvatar image="images/avatar.jpg" /></a>
                    </div>
                );
            }
        });

        var ZWSearchBar = React.createClass({
            handleSubmit: function(e) {
                e.preventDefault();
            },
            handleFocus: function(e) {
            },
            handleBlur: function(e) {
            },
            render: function() {
                return (
                    <div className="zw-search-bar">
                        <form action="" method="post" onSubmit={ this.handleSubmit }>
                            <ZWFormRow fieldType="text" fieldName="zw-field-search" fieldId="zw-field-search" placeholder="Search" focusHandler={ this.handleFocus } blurHandler={ this.handleBlur } />
                            <div className="zw-img-btn zw-search-submit">
                                <button type="submit"></button>
                                <SVGIconSearch />
                            </div>
                        </form>
                    </div>
                );
            }
        });

        var ZWProjectList = React.createClass({
            render: function() {
                var projects = this.props.data.map(function(projectItem) {
                    return (
                        <li key={ projectItem.id }><a href={ '#!m/' + projectItem.id } title={ projectItem.name } className="zw-waves">{ projectItem.name } <SVGIconNext /></a></li>
                    );
                });
                return (
                    <ul id="zw-project-list" className="zw-project-list">
                        { projects }
                    </ul>
                );
            }
        });

        var ZWProjectInfo = React.createClass({
            render: function() {
                return (
                    <form action="" method="post">
                        <ZWFormRow labelTarget={ 'zw-field-project-name--' + this.props.data.id } labelName="Name" fieldType="textarea" fieldValue={ this.props.data.name } fieldName="zw-field-project-name" fieldId={ 'zw-field-project-name--' + this.props.data.id } />

                        <ZWFormRow labelTarget={ 'zw-field-project-from--' + this.props.data.id } labelName="From" fieldType="text" fieldValue={ ZWUtils.formatDateFull( this.props.data.from ) } fieldName="zw-field-project-from" fieldId={ 'zw-field-project-from--' + this.props.data.id } />

                        <ZWFormRow labelTarget={ 'zw-field-project-pm--' + this.props.data.id } labelName="PM" fieldType="text" fieldValue={ this.props.data.pm } fieldName="zw-field-project-pm" fieldId={ 'zw-field-project-pm--' + this.props.data.id } />
                        
                        <ZWFormRow labelTarget={ 'zw-field-project-note--' + this.props.data.id } labelName="Note" fieldType="textarea" fieldValue={ this.props.data.note } fieldName="zw-field-project-note" fieldId={ 'zw-field-project-note--' + this.props.data.id } placeholder={ this.props.data.note === '' ? ZWUtils.locale( 'Insert note', 'en' ) : this.props.data.note } />
                    </form>
                );
            }
        });

        var ZWList = React.createClass({
            render: function() {
                var milestones = this.props.data.map(function(milestoneItem) {
                    return (
                        <li key={ milestoneItem.id }>
                            <ZWMilestone data={ milestoneItem } />
                        </li>
                    );
                });
                return (
                    <ul id="zw-list" className="zw-list">
                        { milestones }
                    </ul>
                );
            }
        });

        var ZWMilestone = React.createClass({
            getInitialState: function() {
                return {expand: false};
            },
            handleClick: function(e) {
                e.preventDefault();

                this.setState({ expand: !this.state.expand });
            },
            render: function() {
                var deliverables = this.props.data.deliverables.map(function(deliverableItem) {
                    return (
                        <li key={ deliverableItem.id }>
                            <ZWDeliverable data={ deliverableItem } />
                        </li>
                    );
                });
                return (
                    <div className="zw-milestone">
                        <ZWTimelineDate date={ ZWUtils.formatDate(this.props.data.dueDate) } />
                        <ZWCheckbox data={ this.props.data.status } />
                        <a className="zw-item-name zw-waves" onClick={ this.handleClick } href="" title={ this.props.data.name }>{ this.props.data.name }</a>

                        <ul className={ 'zw-deliverable' + (this.state.expand ? '' : ' hidden') }>
                            { deliverables }
                        </ul>
                    </div>
                );
            }
        });

        var ZWDeliverable = React.createClass({
            render: function() {
                return (
                    <div className="zw-deliverable">
                        <ZWTimelineDate date={ ZWUtils.formatDate(this.props.data.dueDate) } />
                        <ZWCheckbox data={ this.props.data.status } />
                        <a className="zw-item-name zw-waves" href={ '#!d/' + this.props.data.id } title={ this.props.data.name }>{ this.props.data.name }</a>
                    </div>
                );
            }
        });

        var ZWDeliverableInfo = React.createClass({
            render: function() {
                return (
                    <form action="" method="post">
                        <ZWFormRow labelTarget={ 'zw-field-deliverable-name--' + this.props.data.id } labelName="Name" fieldType="textarea" fieldValue={ this.props.data.name } fieldName="zw-field-deliverable-name" fieldId={ 'zw-field-deliverable-name--' + this.props.data.id } />

                        <ZWFormRow labelTarget={ 'zw-field-deliverable-due--' + this.props.data.id } labelName="Due date" fieldType="text" fieldValue={ ZWUtils.formatDateFull( this.props.data.dueDate ) } fieldName="zw-field-deliverable-due" fieldId={ 'zw-field-deliverable-due--' + this.props.data.id } />

                        <ZWFormRow labelTarget={ 'zw-field-deliverable-effort--' + this.props.data.effort } labelName="Effort" fieldType="text" fieldValue={ this.props.data.effort } fieldName="zw-field-deliverable-effort" fieldId={ 'zw-field-deliverable-effort--' + this.props.data.id } />
                        
                        <ZWFormRow labelTarget={ 'zw-field-deliverable-note--' + this.props.data.id } labelName="Note" fieldType="textarea" fieldValue={ this.props.data.note } fieldName="zw-field-deliverable-note" fieldId={ 'zw-field-deliverable-note--' + this.props.data.id } placeholder={ this.props.data.note === '' ? ZWUtils.locale( 'Insert note', 'en' ) : this.props.data.note } />
                    </form>
                );
            }
        });

        var ZWTaskList = React.createClass({
            render: function() {
                var tasks = this.props.data.map(function(taskItem) {
                    return (
                        <li key={ taskItem.id }>
                            <ZWTask data={ taskItem } />
                        </li>
                    );
                });

                return (
                    <ul className="zw-list zw-tasks-list">
                        { tasks }
                    </ul>
                );
            }
        });

        var ZWTask = React.createClass({
            getInitialState: function() {
                return { expand: false };
            },
            viewTaskDetails: function(e) {
                e.preventDefault();

                this.setState( { expand: !this.state.expand } );
            },
            render: function() {
                return (
                    <div className="zw-task">
                        <ZWTimelineDate date={ ZWUtils.formatDate(this.props.data.dueDate) } />
                        <ZWCheckbox data={ this.props.data.status } />
                        <a onClick={ this.viewTaskDetails } className="zw-item-name zw-waves" href="" title={ this.props.data.name }>{ this.props.data.name }</a>

                        <div className={ 'zw-task__details' + ( this.state.expand ? '' : ' hidden' ) }>
                            { this.state.expand
                                ? <form action={ this.props.data.id } method="post">
                                    <ZWFormRow labelTarget={ 'zw-field-task-from--' + this.props.data.id } labelName="From" fieldType="text" fieldValue={ ZWUtils.formatDateFull( this.props.data.from ) } fieldName="zw-field-task-from" fieldId={ 'zw-field-task-from--' + this.props.data.id } />
                                    <ZWFormRow labelTarget={ 'zw-field-task-due--' + this.props.data.id } labelName="Due date" fieldType="text" fieldValue={ ZWUtils.formatDateFull( this.props.data.dueDate ) } fieldName="zw-field-task-due" fieldId={ 'zw-field-task-due--' + this.props.data.id } />
                                    <ZWFormRow labelTarget={ 'zw-field-task-effort--' + this.props.data.id } labelName="Effort" fieldType="text" fieldValue={ this.props.data.effort } fieldName="zw-field-task-effort" fieldId={ 'zw-field-task-effort--' + this.props.data.id } />
                                    <ZWFormRow labelTarget={ 'zw-field-task-assign--' + this.props.data.id } labelName="Assign" fieldType="text" fieldValue={ this.props.data.assign } fieldName="zw-field-task-assign" fieldId={ 'zw-field-task-assign--' + this.props.data.id } placeholder={ this.props.data.assign === '' ? ZWUtils.locale( 'Assign to', 'en' ) : this.props.data.assign } />
                                    <ZWFormRow labelTarget={ 'zw-field-task-note--' + this.props.data.id } labelName="Note" fieldType="textarea" fieldValue={ this.props.data.note } fieldName="zw-field-task-note" fieldId={ 'zw-field-task-note--' + this.props.data.id } placeholder={ this.props.data.note === '' ? ZWUtils.locale( 'Insert note', 'en' ) : this.props.data.note } />
                                </form>
                                : null
                            }
                        </div>
                    </div>
                );
            }
        });

        var ZWField = React.createClass({
            getInitialState: function() {
                return { value: this.props.defaultValue };
            },
            updateField: function(e) {
                this.setState( { value: e.target.value } );
            },
            handleFocus: function(e) {
                if ( this.props.focusHandler !== undefined ) {
                    this.props.focusHandler.call( null, e );
                }
            },
            handleBlur: function(e) {
                if ( this.props.blurHandler !== undefined ) {
                    this.props.blurHandler.call( null, e );
                }
            },
            render: function() {
                var field = null;
                switch ( this.props.type ) {
                    case 'text':
                        field = <input type="text" placeholder={ this.props.placeholder } value={ this.state.value } name={ this.props.name } id={ this.props.id } onChange={ this.updateField } onFocus={ this.handleFocus } onBlur={ this.handleBlur } />;
                        break;
                    case 'password':
                        field = <input type="password" placeholder={ this.props.placeholder } name={ this.props.name } value={ this.state.value } id={ this.props.id } onChange={ this.updateField } onFocus={ this.handleFocus } onBlur={ this.handleBlur } />;
                        break;
                    case 'textarea':
                        field = <div placeholder={ this.props.placeholder } className="zw-textarea" contentEditable="true" id={ this.props.id } onChange={ this.updateField }>{ this.state.value }</div>
                        break;
                }
                return (
                    <div className="zw-field">
                        { field }
                    </div>
                );
            }
        });

        var ZWFormRow = React.createClass({
            handleFocus: function(e) {
                e.preventDefault();

                $( '#' + $(e.target).attr('for') ).focus();
            },
            render: function() {
                return (
                    <div className="zw-form-row">
                        { this.props.labelTarget === undefined
                            ? null
                            : <label onClick={ this.handleFocus } htmlFor={ this.props.labelTarget }>{ this.props.labelName }</label>
                        }
                        <ZWField focusHandler={ this.props.focusHandler } blurHandler={ this.props.blurHandler } type={ this.props.fieldType } defaultValue={ this.props.fieldValue } name={ this.props.fieldName } id={ this.props.fieldId } placeholder={ this.props.placeholder } />
                    </div>
                );
            }
        });

        var ZWCheckbox = React.createClass({
            /** status
             *  - 0: not start
             *  - 1: on going
             *  - 2: done
             */
            getInitialState: function() {
                return {
                    status: 0
                };
            },
            componentDidMount: function() {
                this.setState( { status: this.props.data } )
            },
            getSVGIcon: function() {
                switch ( this.state.status ) {
                    case 0:
                        return ( <SVGIconItemNormal /> );
                        break;
                    case 1:
                        return ( <SVGIconOnProgress /> );
                        break;
                    case 2:
                        return ( <SVGIconDone /> );
                        break;
                }
            },
            updateStatus: function(e) {
                e.preventDefault();

                var nextStatus = this.state.status == 0 ? 1 : ( this.state.status == 1 ? 2 : 0 ); 
                this.setState( { status: nextStatus } );
            },
            render: function() {
                return (
                    <a href="#" title="" onClick={ this.updateStatus } className={ 'zw-item-status zw-item-status--' + this.state.status }>
                        { this.getSVGIcon() }
                    </a>
                );
            }
        });
    /* end. Block/Instance */

    //entry
        var zwAppDom = document.getElementById('zw-app');
        //Project dashboard view
        ZWPubSub.sub( 'ZWApp.Project:dashboard', function(data) {
            React.render(
                <ZWProjectDashboardPage data={ data } />,
                zwAppDom
            );
        } );

        //Milestone view
        ZWPubSub.sub( 'ZWApp.Project:milestone', function(data) {
            React.render(
                <ZWMilestonePage backLink="#!" data={ data } />,
                zwAppDom
            );
        } );

        //Deliverable view
        ZWPubSub.sub( 'ZWApp.Project:deliverable', function(data) {
            React.render(
                <ZWDeliverablePage backLink={ '#!m/' + data.pid } data={ data } />,
                zwAppDom
            );
        } );

        //Message view
        ZWPubSub.sub( 'ZWApp.Message:app', function(data) {
            React.render(
                <ZWMessagePage data={ data } />,
                zwAppDom
            );
        } );

        //People view
        ZWPubSub.sub( 'ZWApp.People:app', function(data) {
            React.render(
                <ZWPeoplePage data={ data } />,
                zwAppDom
            );
        } );
})(jQuery, Backbone);