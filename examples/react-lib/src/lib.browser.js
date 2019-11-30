/* eslint react/jsx-filename-extension: off */
import React from 'react';
import PropTypes from 'prop-types';

const typeToLabel = {
  stargazers: 'Star',
  watchers: 'Watch',
  forks: 'Fork'
};

const typeToPath = {
  forks: 'network'
};

export function classNames(classSet) {
  return Object.keys(classSet)
    .filter(key => classSet[key])
    .join(' ');
}

export default class GitHubButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: null
    };
  }

  componentDidMount() {
    return fetch(this.getRequestUrl())
      .then(res => res.json())
      .then(res => this.setCount(res));
  }

  setCount(data) {
    if (!data) return;
    const { type } = this.props;
    const count = data[`${type}_count`];
    this.setState({ count });
  }

  getRequestUrl() {
    const { namespace, repo } = this.props;
    return `//api.github.com/repos/${namespace}/${repo}`;
  }

  getRepoUrl() {
    const { namespace, repo } = this.props;
    return `//github.com/${namespace}/${repo}/`;
  }

  getCountUrl() {
    const { namespace, repo, type } = this.props;
    return `//github.com/${namespace}/${repo}/${typeToPath[type] || type}/`;
  }

  getCountStyle() {
    const { count } = this.state;
    if (count !== null) {
      return {
        display: 'block'
      };
    }
    return null;
  }

  render() {
    const { className, type, size, ...rest } = this.props;
    const { count } = this.state;
    delete rest.namespace;
    delete rest.repo;

    const buttonClassName = classNames({
      'github-btn': true,
      'github-btn-large': size === 'large',
      [className]: className
    });

    return (
      <span className={buttonClassName}>
        <a
          className="gh-btn"
          href={this.getRepoUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="gh-ico" aria-hidden="true" />
          <span className="gh-text">{typeToLabel[type]}</span>
        </a>
        <a
          className="gh-count"
          target="_blank"
          rel="noopener noreferrer"
          href={this.getCountUrl()}
          style={this.getCountStyle()}
        >
          {count}
        </a>
      </span>
    );
  }
}

GitHubButton.propTypes = {
  className: PropTypes.string,
  type: PropTypes.oneOf(['stargazers', 'watchers', 'forks']).isRequired,
  namespace: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['large'])
};

GitHubButton.defaultProps = {
  className: '',
  size: 'large'
};
