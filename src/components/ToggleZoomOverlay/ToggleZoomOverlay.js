import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import core from 'core';
import { Popover, Slider } from 'antd';
import classNames from 'classnames';

import ToggleElementButton from 'components/ToggleElementButton';
import ActionButton from 'components/ActionButton';
import { zoomTo, zoomIn, zoomOut } from 'helpers/zoom';
import selectors from 'selectors';
import actions from 'actions';
import useMedia from 'hooks/useMedia';
import zoomFactors from 'constants/zoomFactors';

import './ToggleZoomOverlay.scss';
import { useTranslation } from 'react-i18next';
import { Zoom } from 'src/SvgComponents';

const ToggleZoomOverlay = ({ documentViewerKey = undefined }) => {
  const [t] = useTranslation();

  const elementName = documentViewerKey ? `zoomOverlay${documentViewerKey}` : 'zoomOverlay';
  const buttonName = documentViewerKey ? `zoomOverlayButton${documentViewerKey}` : 'zoomOverlay';

  const isMobile = useMedia(
    // Media queries
    ['(max-width: 640px)'],
    [true],
    // Default value
    false,
  );

  const [showZoom, setShowZoom] = useState(false);
  const [isActive, isMultiViewerMode] = useSelector(
    state => [selectors.isElementOpen(state, elementName), selectors.isMultiViewerMode(state)],
    shallowEqual,
  );
  const dispatch = useDispatch();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const onDocumentLoaded = () => setValue(Math.ceil(core.getZoom(documentViewerKey) * 100).toString());
    const onZoomUpdated = () => setValue(Math.ceil(core.getZoom(documentViewerKey) * 100).toString());
    const onDocumentUnloaded = () => setValue('100');

    core.addEventListener('documentLoaded', onDocumentLoaded, undefined, documentViewerKey);
    core.addEventListener('zoomUpdated', onZoomUpdated, undefined, documentViewerKey);
    core.addEventListener('documentUnloaded', onDocumentUnloaded, undefined, documentViewerKey);

    return () => {
      core.removeEventListener('documentLoaded', onDocumentLoaded, documentViewerKey);
      core.removeEventListener('zoomUpdated', onZoomUpdated, documentViewerKey);
      core.removeEventListener('documentUnloaded', onDocumentUnloaded, documentViewerKey);
    };
  }, []);

  const onKeyPress = e => {
    if (e.nativeEvent.key === 'Enter' || e.nativeEvent.keyCode === 13) {
      const zoom = Math.ceil(core.getZoom(documentViewerKey) * 100).toString();
      if (e.target.value === zoom) {
        return;
      }
      if (e.target.value === '') {
        setValue(zoom);
      } else {
        let zoomValue = e.target.value / 100;
        zoomValue = Math.max(zoomValue, zoomFactors.getMinZoomLevel());
        zoomValue = Math.min(zoomValue, zoomFactors.getMaxZoomLevel());
        zoomTo(zoomValue, isMultiViewerMode, documentViewerKey);
      }
    }
  };

  const onChange = e => {
    const re = /^(\d){0,4}$/;
    if (re.test(e.target.value) || e.target.value === '') {
      setValue(e.target.value);
    }
  };

  const onBlur = e => {
    const zoom = Math.ceil(core.getZoom(documentViewerKey) * 100).toString();
    if (e.target.value === zoom) {
      return;
    }
    if (e.target.value === '' || isNaN(Number(e.target.value))) {
      setValue(zoom);
    } else {
      setValue(Number(e.target.value).toString());
      zoomTo(e.target.value / 100, documentViewerKey);
    }
  };

  const zoom = val => {
    if (val > value) {
      zoomIn(false);
    } else {
      zoomOut(false);
    }

    setValue(val);
  };

  const inputWidth = value ? (value.length + 1) * 8 : 0;

  const handleOpenChange = val => {
    setShowZoom(val);
  };

  return (
    <div className="zoom-overlay">
      <Popover
        open={showZoom}
        placement="bottom"
        trigger={'click'}
        content={() => (
          <div style={{ width: '96px' }}>
            <Slider min={-3} max={3} defaultValue={0} onChange={val => zoom(val)} />
          </div>
        )}
        onOpenChange={handleOpenChange}
      >
        <div onClick={() => setShowZoom(true)}>
          <Zoom />
        </div>
      </Popover>
    </div>
  );
};

export default ToggleZoomOverlay;
