import React, { FunctionComponent, memo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  makeStyles,
  IconButton,
} from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import FacebookIcon from '@material-ui/icons/Facebook';
import { Config } from '../../config';
import LogotypeIcon from '../../../../assets/logotype.svg';
import DiscordIcon from '../../../../assets/DiscordIcon.svg';
import { useCheckForUpdatesQuery } from '../../gql/generated/types';

const useStyles = makeStyles((theme) => ({
  title: {
    fontSize: theme.typography.h4.fontSize,
    lineHeight: theme.typography.h4.fontSize,
  },
  logotype: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  logotypeIcon: {
    marginRight: 12,
  },
  version: {
    fontSize: '0.4em',
  },
  updateAvailable: {
    fontSize: '0.4em',
    marginLeft: '0.4em',
    color: 'rgb(52 216 52) !important',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  social: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  link: {
    margin: '0 0 0 10px',
  },
  facebookIcon: {
    fontSize: '1.2em !important',
    marginTop: '-2px',
  },
  discordIcon: {
    width: '24px',
    height: 'auto',
  },
}));

interface HeaderProps {
  className?: string;
}

const Header: FunctionComponent<HeaderProps> = memo(({ className }) => {
  const styles = useStyles();
  const { data: updateResponse } = useCheckForUpdatesQuery({
    variables: {
      currentVersion: process.env.EXPRESSLRS_CONFIGURATOR_VERSION || '0.0.1',
    },
  });
  return (
    <AppBar position="static" color="default" className={className}>
      <Toolbar className={styles.toolbar}>
        <div className={styles.logotype}>
          <img
            src={LogotypeIcon}
            className={styles.logotypeIcon}
            alt="ExpressLrs Configurator"
          />
          <Typography variant="h4" className={styles.title}>
            ExpressLRS Configurator{' '}
            <span className={styles.version}>
              v{process.env.EXPRESSLRS_CONFIGURATOR_VERSION}
            </span>
            {updateResponse?.checkForUpdates?.updateAvailable && (
              <a
                href={updateResponse?.checkForUpdates?.releaseUrl}
                target="_blank"
                title="Click to download a newest release"
                rel="noreferrer noreferrer"
                className={styles.updateAvailable}
              >
                Update is available!
              </a>
            )}
          </Typography>
        </div>
        <div className={styles.social}>
          <div className={styles.link}>
            <IconButton
              href={Config.discordUrl}
              target="_blank"
              title="Discord"
              rel="noreferrer noreferrer"
            >
              <img src={DiscordIcon} className={styles.discordIcon} alt="" />
            </IconButton>
          </div>
          <div className={styles.link}>
            <IconButton
              href={Config.facebookGroupUrl}
              target="_blank"
              title="Facebook group"
              rel="noreferrer noreferrer"
            >
              <FacebookIcon className={styles.facebookIcon} />
            </IconButton>
          </div>
          <div className={styles.link}>
            <IconButton
              href={Config.githubRepositoryUrl}
              target="_blank"
              title="Github"
              rel="noreferrer noreferrer"
            >
              <GitHubIcon />
            </IconButton>
          </div>
        </div>
      </Toolbar>
    </AppBar>
  );
});

export default Header;
