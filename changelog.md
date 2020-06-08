# Changelog for SAP4Kids
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] 
### Added
 - Added modify feature

## [1.0.4] 
### Added
 - Refresh search available when map moved
 - Filter by assistance types
 - Additional API SchoolOffersByType available as well as AssistanceTypes for filtering by type.

## [1.0.3] 
### Added
 - UI changes for “Help’ menu item 
### Fixed
 - Entry Form - UI fix for org type drop down (show description)
 - Entry Form - UI fix for special character (single quote) in location name
 - UEntry Form - UI changes for School District and School to use different search option (instead of dropdown) 
 - Approver - Delete in approver app working now (on detail/Object page)
 - Resource Locator - Suppress clicks on landmark items on map (was causing some issues)
### Changed
 - Changed the way default data is loaded via csv for local deployment, vs data folder for prod deployment

## [1.0.2] 
### Added
### Changed
 - add padding to map to make step 2 button more visible
### Fixed
 - don't clear subtype on change entitlement

## [1.0.1] Deployed 2020-04-28
### Added
 - Externalized private information to keys.js
### Changed
 - Production RAM increased to 2GB/2 Instances for UI/API
 - Default search radius changed to 50 miles
### Fixed


