// Result Dialog Pattern for POST/PUT/DELETE operations
// Copy this pattern to replace alert messages with dialog boxes

// 1. Add this interface to your component:
interface ResultDialogState {
  open: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
}

// 2. Add this state to your component:
const [resultDialog, setResultDialog] = useState<ResultDialogState>({
  open: false,
  title: '',
  message: '',
  type: 'success'
});

// 3. Replace alert/notification calls with:
// Success example:
setResultDialog({
  open: true,
  title: 'Update Successful',
  message: 'Record updated successfully',
  type: 'success'
});

// Error example:
setResultDialog({
  open: true,
  title: 'Update Failed',
  message: error.message || 'Operation failed. Please try again.',
  type: 'error'
});

// 4. Add this dialog component before the closing </div> of your main container:
{/* Result Dialog */}
<Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog(prev => ({ ...prev, open }))}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className={`flex items-center gap-2 ${
        resultDialog.type === 'success' ? 'text-green-600' : 'text-red-600'
      }`}>
        {resultDialog.type === 'success' ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
        {resultDialog.title}
      </DialogTitle>
    </DialogHeader>
    <div className="py-4">
      <p className="text-gray-700">{resultDialog.message}</p>
    </div>
    <div className="flex justify-end">
      <Button 
        onClick={() => setResultDialog(prev => ({ ...prev, open: false }))}
        className="bg-gradient-to-r from-green-500 to-blue-600"
      >
        OK
      </Button>
    </div>
  </DialogContent>
</Dialog>

// 5. Don't forget to import these icons:
import { CheckCircle, AlertCircle } from "lucide-react";

// 6. Remove old Alert components:
// Delete any {updateResult && (<Alert>...)} or similar components