import {
  Alert,
  AlertTitle,
  Button,
  makeStyles,
  Tab,
  Tabs,
  TextField,
} from '@material-ui/core';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';
import Loader from '../Loader';
import ShowAlerts from '../ShowAlerts';
import Omnibox from '../Omnibox';
import {
  FirmwareSource,
  FirmwareVersionDataInput,
  useGetBranchesLazyQuery,
  useGetTagsLazyQuery,
} from '../../gql/generated/types';
import { ChooseFolderResponseBody, IpcRequest } from '../../../ipc';
import ApplicationStorage from '../../storage';

const useStyles = makeStyles((theme) => ({
  tabs: {
    marginBottom: theme.spacing(2),
  },
  dangerZone: {
    marginBottom: theme.spacing(2),
  },
  tabContents: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  loader: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  chooseFolderButton: {
    marginTop: `${theme.spacing(1)} !important`,
  },
}));

interface FirmwareVersionCardProps {
  data: FirmwareVersionDataInput | null;
  onChange: (data: FirmwareVersionDataInput) => void;
}

const FirmwareVersionForm: FunctionComponent<FirmwareVersionCardProps> = (
  props
) => {
  const { onChange, data } = props;
  const styles = useStyles();

  const [firmwareSource, setFirmwareSource] = useState<FirmwareSource>(
    data?.source || FirmwareSource.GitTag
  );
  const handleFirmwareSourceChange = (
    _event: React.SyntheticEvent,
    value: FirmwareSource
  ) => {
    setFirmwareSource(value);
  };

  const [
    queryGitTags,
    { loading: gitTagsLoading, data: gitTagsResponse, error: tagsError },
  ] = useGetTagsLazyQuery();

  const [
    queryGitBranches,
    {
      loading: gitBranchesLoading,
      data: gitBranchesResponse,
      error: branchesError,
    },
  ] = useGetBranchesLazyQuery();

  const loading = gitTagsLoading || gitBranchesLoading;
  const gitTags = gitTagsResponse?.gitTags ?? [];
  const gitBranches = gitBranchesResponse?.gitBranches ?? [];

  const [currentGitTag, setCurrentGitTag] = useState<string>(
    data?.gitTag || ''
  );
  const onGitTag = (name: string | null) => {
    if (name === null) {
      setCurrentGitTag('');
      return;
    }
    setCurrentGitTag(name);
  };

  const [currentGitBranch, setCurrentGitBranch] = useState<string>(
    data?.gitBranch || ''
  );
  const onGitBranch = (name: string | null) => {
    if (name === null) {
      setCurrentGitBranch('');
      return;
    }
    setCurrentGitBranch(name);
  };

  const [gitCommit, setGitCommit] = useState<string>(data?.gitCommit || '');
  const onGitCommit = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGitCommit(event.target.value);
  };
  const [localPath, setLocalPath] = useState<string>(data?.localPath || '');
  const onLocalPath = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalPath(event.target.value);
  };

  useEffect(() => {
    const storage = new ApplicationStorage();
    storage
      .getFirmwareSource()
      .then((result) => {
        if (result !== null) {
          if (result.source) setFirmwareSource(result.source);
          if (result.gitTag) setCurrentGitTag(result.gitTag);
          if (result.gitCommit) setGitCommit(result.gitCommit);
          if (result.gitBranch) setCurrentGitBranch(result.gitBranch);
          if (result.localPath) setLocalPath(result.localPath);
        }
      })
      .catch((err) => {
        console.error('failed to get firmware source', err);
      });
  }, []);

  const onChooseFolder = () => {
    ipcRenderer
      .invoke(IpcRequest.ChooseFolder)
      .then((result: ChooseFolderResponseBody) => {
        if (result.success) {
          setLocalPath(result.directoryPath);
        }
      })
      .catch((err) => {
        console.log('failed to get local directory path: ', err);
      });
  };

  useEffect(() => {
    setGitCommit('');
    setLocalPath('');

    switch (firmwareSource) {
      case FirmwareSource.GitTag:
        queryGitTags();
        break;
      case FirmwareSource.GitBranch:
        queryGitBranches();
        break;
      case FirmwareSource.GitCommit:
        break;
      case FirmwareSource.Local:
        break;
      default:
        throw new Error(`unknown firmware source: ${firmwareSource}`);
    }
  }, [firmwareSource]);

  useEffect(() => {
    const updatedData = {
      source: firmwareSource,
      gitBranch: currentGitBranch,
      gitTag: currentGitTag,
      gitCommit,
      localPath,
    };
    onChange(updatedData);
    const storage = new ApplicationStorage();
    storage.setFirmwareSource(updatedData).catch((err) => {
      console.error('failed to set firmware source', err);
    });
  }, [firmwareSource, currentGitBranch, currentGitTag, gitCommit, localPath]);

  return (
    <>
      <Tabs
        className={styles.tabs}
        defaultValue={FirmwareSource.GitTag}
        value={firmwareSource}
        onChange={handleFirmwareSourceChange}
      >
        <Tab label="Official releases" value={FirmwareSource.GitTag} />
        <Tab label="Git branch" value={FirmwareSource.GitBranch} />
        <Tab label="Git commit" value={FirmwareSource.GitCommit} />
        <Tab label="Local" value={FirmwareSource.Local} />
      </Tabs>

      {firmwareSource === FirmwareSource.GitTag && gitTags !== undefined && (
        <>
          <div className={styles.tabContents}>
            {!loading && (
              <Omnibox
                title="Releases"
                options={gitTags.map((tag) => ({ label: tag, value: tag }))}
                currentValue={
                  currentGitTag === ''
                    ? null
                    : { label: currentGitTag, value: currentGitTag }
                }
                onChange={onGitTag}
              />
            )}
          </div>
        </>
      )}

      {firmwareSource === FirmwareSource.GitBranch &&
        gitBranches !== undefined && (
          <>
            <Alert severity="warning" className={styles.dangerZone}>
              <AlertTitle>DANGER ZONE</AlertTitle>
              Use these sources only if you know what you are doing or was
              instructed by project developers
            </Alert>
            <div className={styles.tabContents}>
              {!loading && (
                <Omnibox
                  title="Git branches"
                  options={gitBranches.map((branch) => ({
                    label: branch,
                    value: branch,
                  }))}
                  currentValue={
                    currentGitBranch === ''
                      ? null
                      : { label: currentGitBranch, value: currentGitBranch }
                  }
                  onChange={onGitBranch}
                />
              )}
            </div>
          </>
        )}

      {firmwareSource === FirmwareSource.GitCommit && (
        <>
          <Alert severity="warning" className={styles.dangerZone}>
            <AlertTitle>DANGER ZONE</AlertTitle>
            Use these sources only if you know what you are doing or was
            instructed by project developers
          </Alert>
          <div className={styles.tabContents}>
            <TextField
              id="git-commit-hash"
              label="Git commit hash"
              fullWidth
              value={gitCommit}
              onChange={onGitCommit}
            />
          </div>
        </>
      )}

      {firmwareSource === FirmwareSource.Local && (
        <>
          <Alert severity="warning" className={styles.dangerZone}>
            <AlertTitle>DANGER ZONE</AlertTitle>
            Use these sources only if you know what you are doing or was
            instructed by project developers
          </Alert>
          <div className={styles.tabContents}>
            <TextField
              id="local-path"
              label="Local path"
              fullWidth
              value={localPath}
              onChange={onLocalPath}
            />

            <Button
              color="secondary"
              size="small"
              variant="contained"
              className={styles.chooseFolderButton}
              onClick={onChooseFolder}
            >
              Choose folder
            </Button>
          </div>
        </>
      )}

      <Loader loading={loading} />
      <ShowAlerts severity="error" messages={branchesError} />
      <ShowAlerts severity="error" messages={tagsError} />
    </>
  );
};

export default FirmwareVersionForm;
