const React = require('react');
const ReactDOM = require('react-dom');
const axios = require('axios');

// react-bootstrap
const Button = require('react-bootstrap').Button;
const Label = require('react-bootstrap').Label;
const Form = require('react-bootstrap').Form;
const Col = require('react-bootstrap').Col;
const FormControl = require('react-bootstrap').FormControl;
const FormGroup = require('react-bootstrap').FormGroup;
const ControlLabel = require('react-bootstrap').ControlLabel;

class App extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      isAuthorized: props.token !== undefined ? true: false,
      title: props.title,
      url: props.url,
      comment: "",
      token: props.token,
      postBtnDisabled: false,
      loginBtnDisabled: false,
      logoutBtnDisabled: false,
      alert: {
        show: false,
        title: ""
      }
    }
  }

  componentDidMount() {
    const teamName = "";// Enter your team name
    const qiita = new Qiita(teamName, this.state.token);
    qiita.getComments()
    .then((urlList) => {
      console.log(this.state.url);
      if (urlList.indexOf(this.state.url) != -1) {
        this.setState({
          alert: {
            show: true,
            title: "This page is commented!"
          }
        });
      }
    })
    .catch((err) => {
      this.setState({
        alert: {
          show: true,
          title: err
        }
      });
    });
  }

  postComment() {

    this.setState({postBtnDisabled: true});

    const qiita = new Qiita('vasily', this.state.token);
    qiita.postComment(this.state.title, this.state.url, this.state.comment)
    .then((res) => {
      window.close();
    })
    .catch((err) => {
      this.setState({
        alert: {
          show: true,
          title: err
        }
      });
    });
  }

  login() {
    this.setState({postBtnDisabled: true});
    chrome.runtime.sendMessage({greeting: "hello"}, (response) => {
      console.log(response.farewell);
    });
  }

  logout() {
    this.setState({postBtnDisabled: true});
    chrome.storage.local.remove("token", (res) => {
      window.close();
    });
  }

  render() {
    return(
      <div>
        <div class="page-header">
          <h1>Laundry <small>(Beta)</small></h1>
        </div>
        <div style={{display: this.state.isAuthorized ? 'block' : 'none'}}>

          <div style={{display: this.state.alert.show ? 'block' : 'none'}}>
            <Label bsStyle="danger">{this.state.alert.title}</Label>
          </div>

          <div>
            <h5><Label>title</Label></h5>
            <p>{this.state.title}</p>
          </div>
          <div>
            <h5><Label>url</Label></h5>
            <p>{this.state.url}</p>
          </div>

          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}><h5><Label>comment</Label></h5></Col>
              <Col sm={10}>
                <FormControl placeholder="" value={this.state.comment} onChange={(e) => {this.setState({comment: e.target.value})}}/>
              </Col>
            </FormGroup>
          </Form>

          <Button disabled={this.state.postBtnDisabled} onClick={this.postComment.bind(this)}>post</Button>
          <small style={{marginLeft: "10px", cursor: "pointer"}} onClick={this.logout.bind(this)}>logout</small>
        </div>

        <div id="no-authorized" style={{display: !this.state.isAuthorized ? 'block' : 'none'}}>
          <Button disabled={this.state.loginBtnDisabled} onClick={this.login.bind(this)}>login</Button>
        </div>
      </div>
    );
  }
}

chrome.storage.local.get("token", (data) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    ReactDOM.render(
      <App title={tabs[0].title} url={tabs[0].url} token={data.token} />,
      document.getElementById('app')
    );
  });
});

class Qiita {
  constructor(team, token) {
    this.baseUrl = `https://${team}.qiita.com`;

    this.instance = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: {
        "Content-Type": 'application/json',
        "Authorization": 'Bearer ' + token
      }
    });
  }

  getComments() {
    return this.instance.get("/api/v2/items?query=tag:techmtg")
    .then((res) => {
      let itemId = res.data[0].id;
      return this.instance.get(`/api/v2/items/${itemId}/comments`)
    })
    .then((res) => {
      let urlList = res.data.map((x) => {
        let matches = x.body.match(/[\n]?http[s]?:[/]+.*/);
        if (matches != null) {
          return matches[0].trim();
        }
      });
      return Promise.resolve(urlList)
    })
    .catch((err) => {
      return Promise.reject(err);
    });
  }

  postComment(title, url, comment) {
    return this.instance.get("/api/v2/items?query=tag:techmtg")
    .then((res) => {
      let itemId = res.data[0].id,
          body = title + "\n" + url;
      if (comment !== undefined && comment != '') {
        body += "\n\n" + comment
      }
      return this.instance.post(`/api/v2/items/${itemId}/comments`, {
        body: body
      });
    })
    .then((res) => {
      return Promise.resolve(res)
    })
    .catch((err) => {
      return Promise.reject(err);
    });
  }
}
