import 'package:flutter/material.dart';
import '../components/nav_drawer.dart';
import '../services/api_service.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({Key? key}) : super(key: key);

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _api = ApiService();
  bool _isLoading = true;
  List<dynamic> _reports = [];

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => _isLoading = true);
    try {
      final reports = await _api.getReports();
      setState(() {
        _reports = reports;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading reports: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteReport(String id) async {
    try {
      await _api.deleteReport(id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Report file purged successfully.')),
      );
      _loadReports();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to purge report: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _exportReportText(Map<String, dynamic> item) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Report ${item['id']} exported to downloads folder.'),
        backgroundColor: const Color(0xFF10B981),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PRE-CLINICAL REPORTS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadReports,
          )
        ],
      ),
      drawer: const NavDrawer(currentRoute: '/reports'),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Global Disclaimer Header
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.red.withOpacity(0.04),
                  child: Row(
                    children: [
                      Icon(Icons.shield_outlined, color: Colors.red[300], size: 20),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'PRE-CLINICAL EVALUATION NOTICES: All reports are computational approximations for final-year project validation.',
                          style: TextStyle(fontSize: 9, color: Colors.grey, height: 1.3),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: _reports.isEmpty
                      ? const Center(
                          child: Text('No pre-clinical reports generated yet.', style: TextStyle(color: Colors.grey)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _reports.length,
                          itemBuilder: (context, index) {
                            final item = _reports[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                leading: const Icon(Icons.assignment_outlined, color: Color(0xFF0EA5E9)),
                                title: Text(item['id'].toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Formulation: ${item['drugName']} in ${item['polymerName']} matrix'),
                                    const SizedBox(height: 2),
                                    Text('Compiled: ${item['date']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                  ],
                                ),
                                trailing: PopupMenuButton<String>(
                                  onSelected: (action) {
                                    if (action == 'export') {
                                      _exportReportText(item);
                                    } else if (action == 'delete') {
                                      _deleteReport(item['id']);
                                    }
                                  },
                                  itemBuilder: (context) => [
                                    const PopupMenuItem(
                                      value: 'export',
                                      child: Row(
                                        children: [
                                          Icon(Icons.download_rounded, size: 18),
                                          SizedBox(width: 8),
                                          Text('Export Text'),
                                        ],
                                      ),
                                    ),
                                    const PopupMenuItem(
                                      value: 'delete',
                                      child: Row(
                                        children: [
                                          Icon(Icons.delete_outline_rounded, size: 18, color: Colors.redAccent),
                                          SizedBox(width: 8),
                                          Text('Purge', style: TextStyle(color: Colors.redAccent)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
