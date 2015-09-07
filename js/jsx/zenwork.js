'use strict';

(function($) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    var ReactTransitionGroup = React.addons.TransitionGroup;

    var ZWUtils = {
        formatDate: function(/*dd-mm-yyyy*/dateStr, /*default=en*/lang) {
            var lang  = lang === undefined ? 'en' : lang;
            var locale = {
                vi: ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12'],
                en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            }
            var dateObj = dateStr.split('-');
            return dateObj[0] + '-' + locale[lang][ parseInt(dateObj[1]) ];
        },
        locale: function(str, lang) {
            return str;
        }
    };
    var ZWPubSub = {};
    window['ZW_Pattern'].Mediator.installTo( ZWPubSub );

    var ZWPageGroup = React.createClass({
        getInitialState: function() {
            return { items: [] };
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
                    <ZWPage isFirstPage={ i == 0 } key={ item.key } display={ item.display } showHeader={ item.showHeader } headerTitle={ item.headerTitle } content={ item.content } customClass={ item.customClass } />
                );
            }.bind(this));
            return (
                <ReactTransitionGroup className="zw-page-transition" transitionName="fly-in">
                    { items }
                </ReactTransitionGroup>
            );
        }
    });
    var ZWPage = React.createClass({
        getInitialState: function() {
            return {};
        },
        hide: function(e) {
            e.preventDefault();

            ZWPubSub.pub( 'ZWPageGroup:remove', 1 );
        },
        componentDidMount: function() {
        },
        componentWillUnmount: function() {
        },
        componentWillEnter: function(callback) {
            var node = $( React.findDOMNode(this) );
            node.addClass('fly-in-enter');
            setTimeout(function() {
                node
                    .removeClass('fly-in-enter')
                    .addClass('fly-in-enter-active');
            }, 1);
            setTimeout(function() {
                callback();
            }, 200)
        },
        componentDidEnter: function() {
            var node = $( React.findDOMNode(this) );
            node.removeClass('fly-in-enter-active');
        },
        componentWillLeave: function(callback) {
            var node = $( React.findDOMNode(this) );
            node.addClass('fly-in-leave');
            setTimeout(function() {
                node
                    .removeClass('fly-in-leave')
                    .addClass('fly-in-leave-active');
            }, 1);
            setTimeout(function() {
                callback();
            }, 200);
        },
        componentDidLeave: function() {
        },
        render: function() {
            var header = this.props.showHeader
                ? <h2 className={ this.props.isFirstPage ? 'zw-first-page-title' : '' }>{ this.props.isFirstPage ? null : <a href="#" title="" className="zw-back" onClick={ this.hide }><SVGIconBack /></a> }<ZWTextEllipsis text={ this.props.headerTitle === undefined ? '' : this.props.headerTitle } /></h2>
                : null;
            return (
                <div key={ this.props.key } className={ 'zw-page' + ( this.props.customClass === undefined ? '' : (' ' + this.props.customClass) ) }>
                    { header }
                    { this.props.content }
                </div>
            );
        }
    });
    var ZWTextEllipsis = React.createClass({
        render: function() {
            return (
                <span className="zw-text-ellipsis">
                    <em>{ this.props.text }</em>
                    <a href="#" title=""></a>
                </span>
            );
        }
    });

    /*-- end of common --*/

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
                    <li className={ 'zw-main-nav__item' + ( this.state.active === '0' ? ' zw-main-nav__item--active' : '' ) }><a href="" title="Project"><SVGIconProject /></a></li>
                    <li className={ 'zw-main-nav__item' + ( this.state.active === '1' ? ' zw-main-nav__item--active' : '' ) }><a href="" title="Message"><SVGIconMessage /></a></li>
                    <li className="zw-main-nav__item zw-main-nav__item--alt"><a href="" title=""><SVGIconAvatar image="images/avatar.jpg" /></a></li>
                </ul>
            );
        }
    });
    var ZWProject = React.createClass({
        init: false,
        loadDataFromServer: function() {
            var queryString = window.location.search;
            queryString = queryString.substring( queryString.indexOf('?')+1 );
            var dataUrl = queryString.split('=')[1];

            $.ajax({
                url: dataUrl,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    var data = {
                        key: this.props.id,
                        showHeader: true,
                        headerTitle: this.props.name,
                        content: <ZWList data={ data.milestones } />,
                        customClass: ''
                    };
                    if ( !this.init ) {
                        this.init = true;
                        ZWPubSub.pub( 'ZWPageGroup:add', data );
                    }
                    else { //update
                        ZWPubSub.pub( 'ZWPageGroup:update', data );
                    }
                }.bind(this),
                error: function(xhr, status, err) {
                    console.error(dataUrl, status, err.toString());
                }.bind(this)
            });
        },
        componentDidMount: function() { //default call when rendered
            this.loadDataFromServer();
            setInterval(this.loadDataFromServer, this.props.pollInterval);
        },
        render: function() {
            return (
                <div>
                    <div className="zw-nav-bar">
                        <h1>zenwork</h1>
                        <ZWNav active="0" />
                    </div>
                    <ZWPageGroup />
                </div>
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
                    <span className="zw-timeline-date">
                        { ZWUtils.formatDate(this.props.data.dueDate) }
                    </span>
                    <ZWCheckbox data={ this.props.data.status } />
                    <a className="zw-item-name" onClick={ this.handleClick } href={ '#' + this.props.data.id } title={ this.props.data.name }>{ this.props.data.name }</a>

                    <ul className={ 'zw-deliverable' + (this.state.expand ? '' : ' hidden') }>
                        { deliverables }
                    </ul>
                </div>
            );
        }
    });
    var ZWDeliverable = React.createClass({
        viewAllTasks: function(e) {
            e.preventDefault();

            ZWPubSub.pub( 'ZWPageGroup:add', {
                key: this.props.data.id,
                showHeader: true,
                headerTitle: this.props.data.name,
                content: <ZWTaskList url='tasks.json' pollInterval={ 60000 } />,
                customClass: ''
            } );
        },
        render: function() {
            return (
                <div className="zw-deliverable">
                    <span className="zw-timeline-date">
                        { ZWUtils.formatDate(this.props.data.dueDate) }
                    </span>
                    <ZWCheckbox data={ this.props.data.status } />
                    <a onClick={ this.viewAllTasks } className="zw-item-name" href={ '#' + this.props.data.id } title={ this.props.data.name }>{ this.props.data.name }</a>
                </div>
            );
        }
    });
    var ZWTaskList = React.createClass({
        getInitialState: function() {
            return { data: [] };
        },
        loadDataFromServer: function() {
            $.ajax({
                url: this.props.url,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    this.setState({data: data.tasks});
                }.bind(this),
                error: function(xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }.bind(this)
            });
        },
        componentDidMount: function() { //default call when rendered
            this.loadDataFromServer();
            setInterval(this.loadDataFromServer, this.props.pollInterval);
        },
        render: function() {
            var tasks = this.state.data.map(function(taskItem) {
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
                    <span className="zw-timeline-date">
                        { ZWUtils.formatDate(this.props.data.dueDate) }
                    </span>
                    <ZWCheckbox data={ this.props.data.status } />
                    <a onClick={ this.viewTaskDetails } className="zw-item-name" href={ '#' + this.props.data.id } title={ this.props.data.name }>{ this.props.data.name }</a>

                    <div className={ 'zw-task__details' + ( this.state.expand ? '' : ' hidden' ) }>
                        <p><strong>From:</strong> { ZWUtils.formatDate( this.props.data.dueDate ) }</p>
                        <p><strong>Deadline:</strong> { ZWUtils.formatDate( this.props.data.dueDate ) }</p>
                        <p><strong>Effort:</strong> { ZWUtils.formatDate( this.props.data.dueDate ) }</p>
                        <p><strong>Assign:</strong> { ZWUtils.formatDate( this.props.data.dueDate ) }</p>
                    </div>
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

    //entry
    React.render(
        <ZWProject id="P-123" name="Build zenwork app - Simple project management app" pollInterval={ 60000 } />, //interval for 1 minute = 60s * 1000ms
        document.getElementById('zw-project')
    );
})(jQuery);