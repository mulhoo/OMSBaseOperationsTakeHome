import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';
import baseOperationsLogo from './assets/base-operations-logo.png';

const Dashboard = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:3000/api/events';

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchLocationData(selectedLocation.id);
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE}/locations`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);

      if (data.length > 0) {
        setSelectedLocation(data[0]);
      }
    } catch (err) {
      setError(`Error fetching locations: ${err.message}`);
    }
  };

  const fetchLocationData = async (locationId) => {
    setLoading(true);
    setError(null);

    try {
      const [monthlyResponse, recentResponse] = await Promise.all([
        fetch(`${API_BASE}/monthly/${locationId}`),
        fetch(`${API_BASE}/recent/${locationId}`)
      ]);

      if (!monthlyResponse.ok || !recentResponse.ok) {
        throw new Error('Failed to fetch location data');
      }

      const monthlyResult = await monthlyResponse.json();
      const recentResult = await recentResponse.json();

      const formattedMonthlyData = monthlyResult.data.map(item => ({
        month: new Date(item.month).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        }),
        fullDate: item.month,
        count: parseInt(item.total_count),
        location: item.location_name
      }));

      setMonthlyData(formattedMonthlyData);
      setRecentEvents(recentResult.events);
    } catch (err) {
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (e) => {
    const locationId = parseInt(e.target.value);
    const location = locations.find(loc => loc.id === locationId);
    setSelectedLocation(location);
  };

  const formatEventDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventDescription = (event) => {
    const count = event.count;
    const location = event.location_name;
    const date = formatEventDate(event.date);
    const plural = count === 1 ? 'event' : 'events';

    return `${count} ${plural} occurred in ${location} on ${date}`;
  };

  return (
    <div className="dashboard-container">
      <header className="base-operations-header">
        <div className="header-left">
          <div className="base-operations-logo">
            <img src={baseOperationsLogo} alt="Base Operations Logo" className="logo-image" />
          </div>
        </div>
      </header>

      <div className="dashboard-max-width">
        <div className="dashboard-card">
          <div className="location-selector-container">
            <h2 className="content-header">
              Threat Analysis Dashboard
            </h2>
            <div className="location-selector">
              <label htmlFor="location-select" className="location-label">
                Select Location:
              </label>
              <select
                id="location-select"
                value={selectedLocation?.id || ''}
                onChange={handleLocationChange}
                className="location-dropdown"
              >
                <option value="">Choose a location...</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedLocation && (
            <p className="content-subtitle">
              Monitoring threat events and patterns for {selectedLocation.name}
            </p>
          )}
        </div>

        {error && (
          <div className="error-box">
            <div className="error-content">
              <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="error-text">Error Loading Data</h3>
                <p style={{color: '#dc2626', fontSize: '0.875rem', margin: '4px 0'}}>{error}</p>
                <button
                  className="retry-button"
                  onClick={() => selectedLocation ? fetchLocationData(selectedLocation.id) : fetchLocations()}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedLocation && (
          <>
            <div className="dashboard-card">
              <div className="section-header-container">
                <h2 className="section-header">
                  Monthly Threat Events Timeline
                </h2>
                <div className="location-info">
                  Location: {selectedLocation.name}
                </div>
              </div>

              {loading ? (
                <div className="loading-spinner">
                  <span>Loading chart data...</span>
                </div>
              ) : monthlyData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        stroke="#6b7280"
                      />
                      <YAxis
                        label={{ value: 'Event Count', angle: -90, position: 'insideLeft' }}
                        stroke="#6b7280"
                      />
                      <Tooltip
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return new Date(payload[0].payload.fullDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long'
                            });
                          }
                          return label;
                        }}
                        formatter={(value, name) => [value, 'Threat Events']}
                        contentStyle={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#f59e0b"
                        strokeWidth={4}
                        dot={{ fill: "#1f2937", strokeWidth: 3, r: 6, stroke: "#f59e0b" }}
                        activeDot={{ r: 8, fill: "#f59e0b", stroke: "#1f2937", strokeWidth: 2 }}
                        name="Threat Events"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-state">
                  <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-6a2 2 0 01-2-2z" />
                  </svg>
                  <p className="empty-state-title">No monthly data available for {selectedLocation.name}</p>
                  <p className="empty-state-description">Check your API connection and try again</p>
                </div>
              )}
            </div>

            <div className="dashboard-card">
              <div className="section-header-container">
                <h2 className="section-header">
                  Most Recent Threat Events
                </h2>
                <div className="location-info">
                  Last 3 events in {selectedLocation.name}
                </div>
              </div>

              {loading ? (
                <div className="loading-spinner">
                  <span>Loading recent events...</span>
                </div>
              ) : recentEvents.length > 0 ? (
                <div>
                  {recentEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="event-card"
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div style={{flex: 1}}>
                          <p className="event-description">
                            {formatEventDescription(event)}
                          </p>
                          <div className="event-details">
                            <span className="event-detail-item">
                              <span className="event-detail-label">Event Count:</span>
                              <span className="event-count-badge">
                                {event.count}
                              </span>
                            </span>
                            <span className="event-detail-item">
                              <span className="event-detail-label">Date:</span>
                              <span>{formatEventDate(event.date)}</span>
                            </span>
                            <span className="event-detail-item">
                              <span className="event-detail-label">Location:</span>
                              <span>{event.location_name}</span>
                            </span>
                          </div>
                        </div>
                        <div style={{marginLeft: '16px'}}>
                          <span className="event-number-badge">
                            #{index + 1} Most Recent
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="empty-state-title">No recent events found for {selectedLocation.name}</p>
                  <p className="empty-state-description">Check your API connection and try again</p>
                </div>
              )}
            </div>

            <div className="dashboard-footer">
              <p>Base Operations Threat Analysis Dashboard - {selectedLocation.name} Focus</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;