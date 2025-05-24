import React from 'react';
import { Route } from 'react-router-dom';
import { AllSets, SetPage, CardPage } from './index';

// MTG Sets routes to be included in the main app router
const MtgSetsRoutes = [
  <Route key="all-sets" path="/sets" element={<AllSets />} />,
  <Route key="set-detail" path="/sets/:setCode" element={<SetPage />} />,
  <Route key="card-detail" path="/card/:cardId" element={<CardPage />} />
];

export default MtgSetsRoutes; 